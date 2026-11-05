import { api } from './apiClient'

export const buscarPerfil = () => api('me')
export const completarPerfil = () => api('me', { metodo: 'POST' })
export const atualizarPerfil = (dados) => api('me', { metodo: 'PUT', corpo: dados })
export const excluirConta = () => api('me', { metodo: 'DELETE' })
