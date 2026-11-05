import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarOngs,
  buscarMinhaOng,
  criarOng,
  atualizarOng,
  excluirOng,
} from '../services/ongsService'

/** Dados da ONG do usuário logado (criar, editar, excluir). */
export function useMinhaOng({ ativo = true } = {}) {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(buscarMinhaOng, [], {
    ativo,
  })

  const salvar = useCallback(
    async (valores) => {
      const ong = dados?.id ? await atualizarOng(dados.id, valores) : await criarOng(valores)
      setDados(ong)
      return ong
    },
    [dados, setDados],
  )

  const excluir = useCallback(async () => {
    if (!dados?.id) return
    await excluirOng(dados.id)
    setDados(null)
  }, [dados, setDados])

  return { ong: dados, carregando, erro, recarregar, salvar, excluir }
}

/** Lista pública das ONGs parceiras. */
export function useOngs() {
  const { dados, erro, carregando, recarregar } = useRequisicao(listarOngs, [])
  return { ongs: dados ?? [], carregando, erro, recarregar }
}
