import { api } from './apiClient'

export const listarOcorrencias = (filtros) => api('ocorrencias', { query: filtros })
export const buscarOcorrencia = (id) => api(`ocorrencias/${id}`)
export const assumirOcorrencia = (id, observacao) =>
  api(`ocorrencias/${id}/assumir`, { metodo: 'POST', corpo: { observacao } })
export const atualizarStatusOcorrencia = (id, status, observacao) =>
  api(`ocorrencias/${id}/status`, { metodo: 'PATCH', corpo: { status, observacao } })
export const excluirOcorrencia = (id) => api(`ocorrencias/${id}`, { metodo: 'DELETE' })
