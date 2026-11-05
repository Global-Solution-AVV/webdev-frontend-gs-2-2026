import { api } from './apiClient'

export const listarPerdidosPublicos = (filtros) => api('perdidos', { query: filtros })
export const listarMeusPerdidos = () => api('perdidos', { query: { meus: 1 } })
export const buscarPerdido = (id) => api(`perdidos/${id}`)
export const criarPerdido = (dados) => api('perdidos', { metodo: 'POST', corpo: dados })
export const atualizarPerdido = (id, dados) =>
  api(`perdidos/${id}`, { metodo: 'PUT', corpo: dados })
export const excluirPerdido = (id) => api(`perdidos/${id}`, { metodo: 'DELETE' })
export const avistamentosProximos = (id) => api(`perdidos/${id}/avistamentos-proximos`)
