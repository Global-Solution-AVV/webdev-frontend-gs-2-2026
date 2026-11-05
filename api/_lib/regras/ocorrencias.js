import { HORAS_EXPIRACAO_RESERVA, JANELA_PADRAO_HORAS } from '../config.js'
import { diaSP, horaSP } from './datas.js'
import { dentroDoRaio } from './geo.js'

export const STATUS = {
  ABERTA: 'aberta',
  EM_ATENDIMENTO: 'em_atendimento',
  RESGATADO: 'resgatado',
  NAO_ENCONTRADO: 'nao_encontrado',
  ENCAMINHADO_TUTOR: 'encaminhado_tutor',
}

export const STATUS_FINAIS = [STATUS.RESGATADO, STATUS.ENCAMINHADO_TUTOR]

/** Transições que uma ONG pode fazer manualmente (regra 10). */
const TRANSICOES_ONG = {
  [STATUS.ABERTA]: [STATUS.EM_ATENDIMENTO],
  [STATUS.EM_ATENDIMENTO]: [STATUS.RESGATADO, STATUS.NAO_ENCONTRADO, STATUS.ENCAMINHADO_TUTOR],
}

export function ongPodeTransicionar(de, para) {
  return (TRANSICOES_ONG[de] ?? []).includes(para)
}

/** Regra 9: reserva vencida há mais de X horas sem atualização. */
export function reservaExpirada(ocorrencia, agora = new Date()) {
  if (ocorrencia.status !== STATUS.EM_ATENDIMENTO) return false
  const limite = HORAS_EXPIRACAO_RESERVA * 60 * 60 * 1000
  return new Date(agora) - new Date(ocorrencia.atualizada_em) > limite
}

/** Regra 6: conta em quantos dias distintos (fuso SP) houve avistamentos não reconhecidos. */
export function diasDistintosSemTutor(avistamentos) {
  const dias = new Set(
    avistamentos.filter((a) => !a.reconhecido_por_perdido_id).map((a) => diaSP(a.criado_em)),
  )
  return dias.size
}

export function deveAbrirOcorrencia(avistamentos, diasNecessarios) {
  return diasDistintosSemTutor(avistamentos) >= diasNecessarios
}

/** Regra 7: a ONG só vê a ocorrência aberta se o ponto está no raio e ela tem vaga. */
export function ongPodeVerOcorrencia(ong, pontoOcorrencia) {
  return ong.vagas > 0 && dentroDoRaio(ong, pontoOcorrencia, ong.raio_km)
}

const doisDigitos = (h) => String(h).padStart(2, '0')

/**
 * Regra 12: janela de 2 h com mais aparições (considera virada da meia-noite).
 * @returns {null | { inicio: number, fim: number, aparicoes: number, dias: number, texto: string }}
 */
export function padraoHorarios(avistamentos, janela = JANELA_PADRAO_HORAS) {
  if (!avistamentos.length) return null
  const porHora = Array(24).fill(0)
  for (const a of avistamentos) porHora[horaSP(a.criado_em)] += 1

  let melhorInicio = 0
  let melhorTotal = -1
  for (let inicio = 0; inicio < 24; inicio += 1) {
    let total = 0
    for (let k = 0; k < janela; k += 1) total += porHora[(inicio + k) % 24]
    if (total > melhorTotal) {
      melhorTotal = total
      melhorInicio = inicio
    }
  }
  const fim = (melhorInicio + janela) % 24
  const dias = new Set(avistamentos.map((a) => diaSP(a.criado_em))).size
  const rotuloDias = dias === 1 ? 'no último dia' : `nos últimos ${dias} dias`
  return {
    inicio: melhorInicio,
    fim,
    aparicoes: melhorTotal,
    dias,
    texto: `Aparece entre ${doisDigitos(melhorInicio)}h e ${doisDigitos(fim)}h ${rotuloDias}`,
  }
}
