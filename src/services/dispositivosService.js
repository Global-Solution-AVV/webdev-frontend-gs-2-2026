import { api } from './apiClient'

export const listarDispositivos = () => api('dispositivos')
export const criarDispositivo = (dados) => api('dispositivos', { metodo: 'POST', corpo: dados })
export const atualizarDispositivo = (id, dados) =>
  api(`dispositivos/${id}`, { metodo: 'PUT', corpo: dados })
export const reporEstoque = (id, quantidade_g) =>
  api(`dispositivos/${id}/repor`, { metodo: 'POST', corpo: { quantidade_g } })
export const gerarChaveDispositivo = (id) => api(`dispositivos/${id}/chave`, { metodo: 'POST' })
export const excluirDispositivo = (id) => api(`dispositivos/${id}`, { metodo: 'DELETE' })
