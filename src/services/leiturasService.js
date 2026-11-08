import { api } from './apiClient'

/** Histórico de leituras do sensor de um ponto, da mais recente para a mais antiga. */
export const listarLeituras = (dispositivoId, limite = 36) =>
  api('leituras', { query: { dispositivo_id: dispositivoId, limite } })
