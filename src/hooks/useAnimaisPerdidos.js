import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarMeusPerdidos,
  listarPerdidosPublicos,
  criarPerdido,
  atualizarPerdido,
  excluirPerdido,
} from '../services/perdidosService'

/**
 * Animais perdidos sem chip.
 * - publico: lista os ativos de todos (sem dados do tutor) para o mapa;
 * - caso contrário: CRUD dos animais perdidos do tutor logado.
 */
export function useAnimaisPerdidos({ publico = false, especie = '' } = {}) {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(
    () => (publico ? listarPerdidosPublicos({ especie }) : listarMeusPerdidos()),
    [publico, especie],
  )

  const criar = useCallback(
    async (valores) => {
      const novo = await criarPerdido(valores)
      setDados((lista) => [novo, ...(lista ?? [])])
      return novo
    },
    [setDados],
  )

  const atualizar = useCallback(
    async (id, valores) => {
      const atualizado = await atualizarPerdido(id, valores)
      setDados((lista) => (lista ?? []).map((p) => (p.id === id ? atualizado : p)))
      return atualizado
    },
    [setDados],
  )

  const marcarEncontrado = useCallback(
    (perdido) => atualizar(perdido.id, { ...perdido, status: 'encontrado' }),
    [atualizar],
  )

  const excluir = useCallback(
    async (id) => {
      await excluirPerdido(id)
      setDados((lista) => (lista ?? []).filter((p) => p.id !== id))
    },
    [setDados],
  )

  return {
    perdidos: dados ?? [],
    carregando,
    erro,
    recarregar,
    criar,
    atualizar,
    marcarEncontrado,
    excluir,
  }
}
