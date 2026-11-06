import { useRequisicao } from './useRequisicao'
import { listarCartazes } from '../services/petsService'

/** Cartazes públicos de pets com chip (sem login), filtrados por situação e espécie. */
export function useCartazes({ situacao = 'perdidos', especie = '' } = {}) {
  const { dados, erro, carregando, recarregar } = useRequisicao(
    () => listarCartazes({ situacao, especie }),
    [situacao, especie],
  )
  return { cartazes: dados ?? [], erro, carregando, recarregar }
}
