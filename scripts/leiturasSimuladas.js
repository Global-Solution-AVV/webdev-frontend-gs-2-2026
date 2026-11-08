// Gera um histórico FICTÍCIO de leituras do sensor para os pontos de demonstração.
// Usado por scripts/simular-leituras.js (envia pela API, como o ESP32) e por scripts/seed.js.
// Os valores são determinísticos: rodar de novo gera as mesmas curvas.
import { estadoPelasMedidas } from '../api/_lib/regras/leituras.js'

const HORA_MS = 3600000

// Como cada ponto se comporta. consumo = % do silo por hora; recargaHa = horas atrás em que o
// silo foi reabastecido; paradoHa = horas desde a última leitura (ponto em manutenção).
export const PERFIS = {
  'DV-001': { silo: 90, consumo: 0.3, temp: 25, umid: 60 },
  'DV-002': { silo: 85, consumo: 0.5, temp: 26, umid: 58 },
  'DV-003': { silo: 70, consumo: 0.35, temp: 24, umid: 62 },
  'DV-004': { silo: 45, consumo: 0.45, temp: 25, umid: 60 }, // termina com estoque baixo
  'DV-005': { silo: 60, consumo: 0.6, temp: 27, umid: 55, recargaHa: 30 },
  'DV-006': { silo: 92, consumo: 0.25, temp: 25, umid: 57 },
  'DV-007': { silo: 80, consumo: 0.4, temp: 26, umid: 59 },
  'DV-008': { silo: 75, consumo: 0.3, temp: 23, umid: 80 }, // parque: úmido, ração em risco à noite
  'DV-009': { silo: 66, consumo: 0.3, temp: 24, umid: 61 },
  'DV-010': { silo: 88, consumo: 0.45, temp: 26, umid: 56 },
  'DV-011': { silo: 50, consumo: 0.3, temp: 24, umid: 60, paradoHa: 40 }, // em manutenção
  'DV-012': { silo: 78, consumo: 0.35, temp: 25, umid: 58 },
}

// Ruído pequeno e repetível (sem Math.random), de -1 a 1.
function ruido(semente) {
  const x = Math.sin(semente * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

function horaEmSP(data) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(data),
  )
}

const limitar = (v, min, max) => Math.min(max, Math.max(min, v))
const umaCasa = (v) => Math.round(v * 10) / 10

/** Uma leitura do ponto `codigo`, `horasAtras` horas antes de `agora`. */
export function leituraSimulada(codigo, horasAtras, totalHoras, agora = new Date()) {
  const p = PERFIS[codigo]
  const medidoEm = new Date(agora.getTime() - horasAtras * HORA_MS)
  const semente = codigo.charCodeAt(5) * 1000 + Math.round(horasAtras * 10)

  // Silo: cai com o consumo; se houve recarga, volta a 95% naquele momento.
  let nivel = p.silo - p.consumo * (totalHoras - horasAtras)
  if (p.recargaHa !== undefined && horasAtras <= p.recargaHa) {
    nivel = 95 - p.consumo * (p.recargaHa - horasAtras)
  }
  nivel = limitar(nivel + ruido(semente) * 0.5, 0, 100)

  // Temperatura com pico às 15h e mínimo de madrugada; umidade faz o contrário.
  const ciclo = Math.sin((2 * Math.PI * (horaEmSP(medidoEm) - 9)) / 24)
  const temperatura = limitar(p.temp + 5 * ciclo + ruido(semente + 1) * 0.6, -40, 80)
  const umidade = limitar(p.umid - 12 * ciclo + ruido(semente + 2) * 2, 0, 100)

  const medidas = {
    nivel_silo_pct: umaCasa(nivel),
    temperatura_c: umaCasa(temperatura),
    umidade_pct: umaCasa(umidade),
  }
  return { medido_em: medidoEm.toISOString(), ...medidas, estado: estadoPelasMedidas(medidas) }
}

/**
 * Histórico de um ponto: uma leitura a cada `intervaloHoras`, cobrindo `totalHoras`,
 * da mais antiga para a mais recente. A última fica poucos minutos antes de agora
 * (ou `paradoHa` horas antes, para o ponto em manutenção).
 */
export function historicoSimulado(codigo, { totalHoras = 72, intervaloHoras = 2, agora } = {}) {
  const p = PERFIS[codigo]
  if (!p) throw new Error(`Sem perfil de simulação para ${codigo}`)
  const fim = p.paradoHa ?? 0.1 + (codigo.charCodeAt(5) % 5) * 0.05
  const leituras = []
  for (let h = totalHoras; h > fim; h -= intervaloHoras) {
    leituras.push(leituraSimulada(codigo, h, totalHoras, agora))
  }
  leituras.push(leituraSimulada(codigo, fim, totalHoras, agora))
  return leituras
}
