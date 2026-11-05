import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarDispositivos,
  criarDispositivo,
  atualizarDispositivo,
  reporEstoque,
  gerarChaveDispositivo,
  excluirDispositivo,
} from '../services/dispositivosService'

/** CRUD dos pontos de identificação, estoque de ração e chave de API (coordenação). */
export function useDispositivos() {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(listarDispositivos, [])

  const trocar = useCallback(
    (d) => setDados((lista) => (lista ?? []).map((x) => (x.id === d.id ? { ...x, ...d } : x))),
    [setDados],
  )

  const criar = useCallback(
    async (valores) => {
      const novo = await criarDispositivo(valores)
      setDados((lista) => [...(lista ?? []), novo].sort((a, b) => a.codigo.localeCompare(b.codigo)))
      return novo
    },
    [setDados],
  )

  const atualizar = useCallback(
    async (id, valores) => {
      const d = await atualizarDispositivo(id, valores)
      trocar(d)
      return d
    },
    [trocar],
  )

  const repor = useCallback(
    async (id, quantidade) => {
      const d = await reporEstoque(id, quantidade)
      trocar(d)
      return d
    },
    [trocar],
  )

  const gerarChave = useCallback(
    async (id) => {
      const { chave } = await gerarChaveDispositivo(id)
      setDados((lista) => (lista ?? []).map((x) => (x.id === id ? { ...x, tem_chave: true } : x)))
      return chave
    },
    [setDados],
  )

  const excluir = useCallback(
    async (id) => {
      await excluirDispositivo(id)
      setDados((lista) => (lista ?? []).filter((x) => x.id !== id))
    },
    [setDados],
  )

  const lista = dados ?? []
  return {
    dispositivos: lista,
    comEstoqueBaixo: lista.filter((d) => d.estoque_baixo),
    carregando,
    erro,
    recarregar,
    criar,
    atualizar,
    repor,
    gerarChave,
    excluir,
  }
}
