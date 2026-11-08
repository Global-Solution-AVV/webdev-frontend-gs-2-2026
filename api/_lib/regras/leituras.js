// Leituras do sensor dos pontos de identificação (spec §6.4 e regras 2 e 13).
// O nível de ração vem só daqui: não existe estoque editado à mão.

/** Abaixo disso, alerta de estoque baixo (mesmo limite do ESP32). */
export const NIVEL_BAIXO_PCT = 20
/** Abaixo disso, o silo está vazio e o ponto não libera porção (mesmo limite do ESP32). */
export const NIVEL_VAZIO_PCT = 5

export const TEMP_RISCO_C = 35
export const UMID_RISCO_PCT = 85

/** Estados que o ESP32 publica (specs/edge/SPEC.md §6). */
export const ESTADOS_PONTO = [
  'AGUARDANDO',
  'MOVIMENTO',
  'ANIMAL_CONFIRMADO',
  'LENDO_CHIP',
  'CHIP_ENCONTRADO',
  'SEM_CHIP',
  'BLOQUEADO',
  'ESTOQUE_BAIXO',
  'RACAO_EM_RISCO',
  'FALHA',
]

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000
const MAXIMO_PASSADO_MS = 7 * 24 * 60 * 60 * 1000

function medida(valor, campo, min, max) {
  if (valor === null || valor === undefined) return { valor: null }
  const n = typeof valor === 'number' ? valor : Number.NaN
  if (!Number.isFinite(n) || n < min || n > max) {
    return { erro: `${campo} deve ser um número entre ${min} e ${max} (ou null)` }
  }
  return { valor: Math.round(n * 10) / 10 }
}

/**
 * Valida a leitura enviada pelo ponto.
 * @returns {{ ok: true, dados: object } | { ok: false, erro: string }}
 */
export function validarLeitura(entrada, agora = new Date()) {
  if (!entrada || typeof entrada !== 'object') return { ok: false, erro: 'Envie um objeto JSON' }

  let medidoEm = agora
  if (entrada.medido_em !== null && entrada.medido_em !== undefined) {
    medidoEm = new Date(entrada.medido_em)
    if (typeof entrada.medido_em !== 'string' || Number.isNaN(medidoEm.getTime())) {
      return { ok: false, erro: 'medido_em deve ser uma data ISO 8601' }
    }
    const diferenca = medidoEm.getTime() - agora.getTime()
    if (diferenca > TOLERANCIA_FUTURO_MS) return { ok: false, erro: 'medido_em está no futuro' }
    if (-diferenca > MAXIMO_PASSADO_MS) {
      return { ok: false, erro: 'medido_em tem mais de 7 dias' }
    }
  }

  const nivel = medida(entrada.nivel_silo_pct, 'nivel_silo_pct', 0, 100)
  const temp = medida(entrada.temperatura_c, 'temperatura_c', -40, 80)
  const umid = medida(entrada.umidade_pct, 'umidade_pct', 0, 100)
  const erro = nivel.erro ?? temp.erro ?? umid.erro
  if (erro) return { ok: false, erro }
  if (nivel.valor === null && temp.valor === null && umid.valor === null) {
    return { ok: false, erro: 'Envie pelo menos uma medida (nível, temperatura ou umidade)' }
  }

  let estado = null
  if (entrada.estado !== null && entrada.estado !== undefined) {
    if (!ESTADOS_PONTO.includes(entrada.estado)) {
      return { ok: false, erro: `estado deve ser: ${ESTADOS_PONTO.join(', ')}` }
    }
    estado = entrada.estado
  }

  return {
    ok: true,
    dados: {
      medido_em: medidoEm.toISOString(),
      nivel_silo_pct: nivel.valor,
      temperatura_c: temp.valor,
      umidade_pct: umid.valor,
      estado,
    },
  }
}

/** Regra 13: estoque baixo pela última leitura. Sem leitura ou sem nível, não alerta. */
export function estoqueBaixo(ultimaLeitura) {
  const nivel = ultimaLeitura?.nivel_silo_pct
  return nivel !== null && nivel !== undefined && Number(nivel) < NIVEL_BAIXO_PCT
}

/** Regra 2 (parte do estoque): silo vazio pela última leitura. */
export function siloVazio(ultimaLeitura) {
  const nivel = ultimaLeitura?.nivel_silo_pct
  return nivel !== null && nivel !== undefined && Number(nivel) < NIVEL_VAZIO_PCT
}

/** Mesmo critério de estado ocioso do ESP32 (usado pela simulação de leituras). */
export function estadoPelasMedidas({ nivel_silo_pct, temperatura_c, umidade_pct }) {
  if (temperatura_c >= TEMP_RISCO_C || umidade_pct >= UMID_RISCO_PCT) return 'RACAO_EM_RISCO'
  if (nivel_silo_pct < NIVEL_BAIXO_PCT) return 'ESTOQUE_BAIXO'
  return 'AGUARDANDO'
}
