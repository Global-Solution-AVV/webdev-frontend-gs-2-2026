import { FUSO } from '../config.js'

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatoHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO,
  hour: '2-digit',
  hourCycle: 'h23',
})

/** Dia no fuso de São Paulo, no formato AAAA-MM-DD. */
export function diaSP(data) {
  return formatoDia.format(new Date(data))
}

/** Hora (0 a 23) no fuso de São Paulo. */
export function horaSP(data) {
  return Number(formatoHora.format(new Date(data)))
}

/** true se as duas datas caem no mesmo dia em São Paulo. */
export function mesmoDiaSP(a, b) {
  return diaSP(a) === diaSP(b)
}

/**
 * Início (00:00) do dia em São Paulo, `diasAtras` dias antes da data informada.
 * O Brasil não tem horário de verão desde 2019, então o offset é fixo em -03:00.
 */
export function inicioDoDiaSP(data = new Date(), diasAtras = 0) {
  const inicioHoje = new Date(`${diaSP(data)}T00:00:00-03:00`)
  return new Date(inicioHoje.getTime() - diasAtras * 24 * 60 * 60 * 1000)
}
