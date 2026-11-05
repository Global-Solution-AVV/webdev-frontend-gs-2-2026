import { api } from './apiClient'

export const enviarDeteccao = (dados) => api('deteccoes', { metodo: 'POST', corpo: dados })
export const listarDeteccoes = () => api('deteccoes')
