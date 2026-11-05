import { api } from './apiClient'

/** filtros: { lat, lng, raio_km, desde, ate, especie } */
export const listarAvistamentos = (filtros) => api('avistamentos', { query: filtros })
export const reconhecerAvistamento = (id, perdido_id) =>
  api(`avistamentos/${id}/reconhecer`, { metodo: 'PATCH', corpo: { perdido_id } })
