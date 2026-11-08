import { useRequisicao } from './useRequisicao'
import { listarLeituras } from '../services/leiturasService'

/** Histórico de leituras do sensor de um ponto (coordenação). Não carrega sem dispositivoId. */
export function useLeituras(dispositivoId) {
  const { dados, erro, carregando, recarregar } = useRequisicao(
    () => listarLeituras(dispositivoId),
    [dispositivoId],
    { ativo: Boolean(dispositivoId) },
  )
  return { leituras: dados ?? [], erro, carregando, recarregar }
}
