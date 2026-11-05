import { api } from './apiClient'

export const listarOngs = () => api('ongs')
export const buscarMinhaOng = () => api('ongs', { query: { minha: 1 } })
export const criarOng = (dados) => api('ongs', { metodo: 'POST', corpo: dados })
export const atualizarOng = (id, dados) => api(`ongs/${id}`, { metodo: 'PUT', corpo: dados })
export const excluirOng = (id) => api(`ongs/${id}`, { metodo: 'DELETE' })
