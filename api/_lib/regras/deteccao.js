import { CATEGORIAS_ACEITAS } from '../config.js'
import { mesmoDiaSP } from './datas.js'
import { siloVazio } from './leituras.js'

/**
 * Regra 1: filtra a detecção.
 * @returns {{ aceita: boolean, motivo?: string }}
 */
export function avaliarDeteccao({ categoria, confidence }, confidenceMinima) {
  if (confidenceMinima === null || confidenceMinima === undefined) {
    throw new Error('CONFIDENCE_MINIMA não configurada')
  }
  const cat = String(categoria ?? '').toLowerCase()
  if (!CATEGORIAS_ACEITAS.includes(cat)) {
    return { aceita: false, motivo: `Categoria "${categoria}" não é gato nem cachorro` }
  }
  const conf = Number(confidence)
  if (!Number.isFinite(conf) || conf < 0 || conf > 1) {
    return { aceita: false, motivo: 'Confidence inválida (deve estar entre 0 e 1)' }
  }
  if (conf < confidenceMinima) {
    return { aceita: false, motivo: `Confidence ${conf} abaixo do mínimo ${confidenceMinima}` }
  }
  return { aceita: true }
}

/**
 * Regra 2: decide se o dispositivo pode liberar a porção.
 * O estoque vem da última leitura do sensor (sem leitura, não bloqueia).
 * @returns {{ liberar: boolean, motivo?: string }}
 */
export function podeLiberarPorcao(dispositivo, porcoesHoje, ultimaLeitura = null) {
  if (dispositivo.status !== 'ativo') {
    return { liberar: false, motivo: `Dispositivo em ${dispositivo.status}` }
  }
  if (siloVazio(ultimaLeitura)) {
    return { liberar: false, motivo: 'Silo vazio na última leitura do sensor' }
  }
  if (porcoesHoje >= dispositivo.limite_porcoes_dia) {
    return { liberar: false, motivo: 'Limite de porções do dia atingido' }
  }
  return { liberar: true }
}

/**
 * Regra 3: decide o tipo de aviso ao tutor quando o chip do pet é lido.
 * - modo perdido: aviso imediato, sempre;
 * - sem modo perdido: no máximo um aviso por dia (fuso de SP).
 * @returns {'imediato' | 'diario' | null}
 */
export function decidirNotificacao(pet, agora = new Date()) {
  if (pet.modo_perdido) return 'imediato'
  if (pet.ultimo_aviso_em && mesmoDiaSP(pet.ultimo_aviso_em, agora)) return null
  return 'diario'
}
