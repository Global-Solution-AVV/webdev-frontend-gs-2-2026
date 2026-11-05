// Parâmetros de negócio do DeVolta (spec §3).
// N e X foram decididos pela equipe e podem ser revistos após a entrevista com uma ONG.

export const DIAS_RECORRENCIA_RESGATE = 3 // N
export const HORAS_EXPIRACAO_RESERVA = 24 // X
export const AVISOS_POR_DIA_SEM_MODO_PERDIDO = 1
export const CATEGORIAS_ACEITAS = ['gato', 'cachorro']
export const FUSO = 'America/Sao_Paulo'
export const JANELA_PADRAO_HORAS = 2

// Valores AINDA NÃO DEFINIDOS (spec §14). Vêm de variáveis de ambiente e
// não têm valor padrão de propósito: precisam ser alinhados com Python e Edge.
function numeroDoAmbiente(nome) {
  const bruto = process.env[nome]
  if (bruto === undefined || bruto === '') return null
  const valor = Number(bruto)
  return Number.isFinite(valor) ? valor : null
}

export function confidenceMinima() {
  return numeroDoAmbiente('CONFIDENCE_MINIMA')
}

export function raioComparacaoPerdidosKm() {
  return numeroDoAmbiente('RAIO_COMPARACAO_PERDIDOS_KM')
}
