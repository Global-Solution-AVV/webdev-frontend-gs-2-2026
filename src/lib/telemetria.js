// Interpretação das mensagens MQTT publicadas pelos pontos de identificação (ESP32).
// Funções puras, sem React e sem rede, testadas em telemetria.test.js.
// Contrato dos tópicos: specs/edge/SPEC.md §7.5 · uso na página: specs/webdev-frontend/SPEC.md §6.3

export const ASSUNTOS = ['conexao', 'telemetria', 'estado', 'evento']

/** Sem telemetria por mais que isso, o ponto aparece "sem sinal" (ele publica a cada 5 s). */
export const LIMITE_SEM_SINAL_MS = 15_000

/** Quantos eventos recentes o painel guarda. */
export const MAX_EVENTOS = 10

const CODIGO_VALIDO = /^[A-Z0-9-]{1,20}$/
const ESTADO_VALIDO = /^[A-Z_]{1,30}$/
const NIVEIS_AMBIENTE = ['normal', 'atencao', 'risco']
const TIPOS_EVENTO = ['chip', 'avistamento']

/** Número dentro da faixa, ou null (valor ausente, inválido ou fora da faixa). */
export function numeroOuNull(valor, min, max) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null
  if (valor < min || valor > max) return null
  return valor
}

function textoOuNull(valor, max = 120) {
  return typeof valor === 'string' && valor.length <= max ? valor : null
}

function lerJson(texto) {
  try {
    const dados = JSON.parse(texto)
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : null
  } catch {
    return null
  }
}

function validarTelemetria(d) {
  if (typeof d.estado !== 'string' || !ESTADO_VALIDO.test(d.estado)) return null
  return {
    estado: d.estado,
    siloPct: numeroOuNull(d.silo_pct, 0, 100),
    temperaturaC: numeroOuNull(d.temperatura_c, -40, 80),
    umidadePct: numeroOuNull(d.umidade_pct, 0, 100),
    ambiente: NIVEIS_AMBIENTE.includes(d.ambiente) ? d.ambiente : null,
    porcoesHoje: numeroOuNull(d.porcoes_hoje, 0, 10_000),
    limitePorcoesDia: numeroOuNull(d.limite_porcoes_dia, 0, 10_000),
    fila: numeroOuNull(d.fila, 0, 1_000),
  }
}

function validarEstado(d) {
  if (typeof d.estado !== 'string' || !ESTADO_VALIDO.test(d.estado)) return null
  return {
    estado: d.estado,
    anterior: typeof d.anterior === 'string' && ESTADO_VALIDO.test(d.anterior) ? d.anterior : null,
    detalhe: textoOuNull(d.detalhe) ?? '',
  }
}

function validarEvento(d) {
  if (!TIPOS_EVENTO.includes(d.tipo)) return null
  return {
    tipo: d.tipo,
    categoria: textoOuNull(d.categoria, 20) ?? '?',
    confidence: numeroOuNull(d.confidence, 0, 1),
    chipMascarado: d.tipo === 'chip' ? textoOuNull(d.chip_mascarado, 20) : null,
  }
}

/**
 * Converte uma mensagem do broker em { codigo, assunto, dados }.
 * Devolve null para tópico fora do prefixo, assunto desconhecido ou conteúdo inválido.
 */
export function interpretarMensagem(prefixo, topico, texto) {
  if (typeof topico !== 'string' || !topico.startsWith(`${prefixo}/`)) return null
  const partes = topico.slice(prefixo.length + 1).split('/')
  if (partes.length !== 2) return null
  const [codigo, assunto] = partes
  if (!CODIGO_VALIDO.test(codigo) || !ASSUNTOS.includes(assunto)) return null

  if (assunto === 'conexao') {
    return texto === 'online' || texto === 'offline' ? { codigo, assunto, dados: texto } : null
  }
  const json = lerJson(texto)
  if (!json) return null
  const validar = { telemetria: validarTelemetria, estado: validarEstado, evento: validarEvento }
  const dados = validar[assunto](json)
  return dados ? { codigo, assunto, dados } : null
}

/** Aplica a mensagem ao mapa { codigo: ponto } sem modificar o original. */
export function aplicarMensagem(pontos, mensagem, agora) {
  const { codigo, assunto, dados } = mensagem
  const anterior = pontos[codigo] ?? { codigo }
  let atualizado
  switch (assunto) {
    case 'conexao':
      atualizado = { ...anterior, conexao: dados, conexaoEm: agora }
      break
    case 'telemetria':
      atualizado = {
        ...anterior,
        telemetria: dados,
        telemetriaEm: agora,
        estado: dados.estado,
        // não mexe em `conexao`: a telemetria retida no broker chega mesmo com o ponto desligado
      }
      break
    case 'estado':
      atualizado = { ...anterior, estado: dados.estado, detalhe: dados.detalhe, estadoEm: agora }
      break
    default:
      return pontos // eventos ficam na lista própria (adicionarEvento)
  }
  return { ...pontos, [codigo]: atualizado }
}

/** Coloca o evento no topo da lista e mantém só os MAX_EVENTOS mais recentes. */
export function adicionarEvento(eventos, mensagem, agora) {
  if (mensagem.assunto !== 'evento') return eventos
  const novo = {
    id: `${mensagem.codigo}-${agora}`,
    codigo: mensagem.codigo,
    ...mensagem.dados,
    recebidoEm: agora,
  }
  return [novo, ...eventos].slice(0, MAX_EVENTOS)
}

/** 'online' | 'sem_sinal' | 'offline' */
export function situacaoDoPonto(ponto, agora) {
  if (!ponto || ponto.conexao === 'offline') return 'offline'
  if (ponto.telemetriaEm === undefined) return ponto.conexao === 'online' ? 'sem_sinal' : 'offline'
  return agora - ponto.telemetriaEm <= LIMITE_SEM_SINAL_MS ? 'online' : 'sem_sinal'
}

// Limites iguais aos do ESP32 (specs/edge/SPEC.md §5).
export const NIVEL_BAIXO_PCT = 20
const TEMP_ATENCAO_C = 30
const TEMP_RISCO_C = 35
const UMID_ATENCAO_PCT = 70
const UMID_RISCO_PCT = 85

const numeroOuVazio = (v) => (v === null || v === undefined ? null : Number(v))

function ambienteDasMedidas(temperaturaC, umidadePct) {
  if (temperaturaC === null && umidadePct === null) return null
  if (temperaturaC >= TEMP_RISCO_C || umidadePct >= UMID_RISCO_PCT) return 'risco'
  if (temperaturaC >= TEMP_ATENCAO_C || umidadePct >= UMID_ATENCAO_PCT) return 'atencao'
  return 'normal'
}

/**
 * A leitura que a página mostra para um ponto, de uma fonte só:
 * - ponto online: o que chega agora pelo broker (origem 'ao_vivo');
 * - senão: a última leitura gravada na plataforma, com a data dela (origem 'gravada');
 * - nenhuma das duas: null.
 */
export function leituraExibida(pontoAoVivo, situacao, ultimaLeitura) {
  const t = pontoAoVivo?.telemetria
  if (situacao === 'online' && t) {
    return {
      origem: 'ao_vivo',
      medidoEm: pontoAoVivo.telemetriaEm,
      estado: pontoAoVivo.estado ?? t.estado,
      siloPct: t.siloPct,
      temperaturaC: t.temperaturaC,
      umidadePct: t.umidadePct,
      ambiente: t.ambiente ?? ambienteDasMedidas(t.temperaturaC, t.umidadePct),
    }
  }
  if (!ultimaLeitura) return null
  const temperaturaC = numeroOuVazio(ultimaLeitura.temperatura_c)
  const umidadePct = numeroOuVazio(ultimaLeitura.umidade_pct)
  return {
    origem: 'gravada',
    medidoEm: ultimaLeitura.medido_em,
    estado: ultimaLeitura.estado ?? null,
    siloPct: numeroOuVazio(ultimaLeitura.nivel_silo_pct),
    temperaturaC,
    umidadePct,
    ambiente: ambienteDasMedidas(temperaturaC, umidadePct),
  }
}

/** Motivos de atenção de uma leitura (estoque baixo, ração em risco, falha), ou lista vazia. */
export function motivosDeAtencao(leitura) {
  if (!leitura) return []
  const motivos = []
  if (leitura.estado === 'FALHA') motivos.push('falha de sensor')
  if (leitura.siloPct !== null && leitura.siloPct < NIVEL_BAIXO_PCT) {
    motivos.push(`estoque baixo (${leitura.siloPct}%)`)
  }
  if (leitura.ambiente === 'risco' || leitura.estado === 'RACAO_EM_RISCO') {
    motivos.push('ração em risco')
  }
  return motivos
}
