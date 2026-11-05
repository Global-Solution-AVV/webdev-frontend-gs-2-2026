import { api } from './apiClient'

export const listarNotificacoes = () => api('notificacoes')
export const responderNotificacao = (id, resposta) =>
  api(`notificacoes/${id}/resposta`, { metodo: 'PATCH', corpo: { resposta } })
export const marcarComoLida = (id) => api(`notificacoes/${id}/lida`, { metodo: 'PATCH' })
export const excluirNotificacao = (id) => api(`notificacoes/${id}`, { metodo: 'DELETE' })
