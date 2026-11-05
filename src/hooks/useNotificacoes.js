import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarNotificacoes,
  responderNotificacao,
  marcarComoLida,
  excluirNotificacao,
} from '../services/notificacoesService'

/** Avisos ("SMS" simulado) recebidos pelo tutor quando o chip do pet é lido. */
export function useNotificacoes() {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(listarNotificacoes, [])

  const trocar = useCallback(
    (n) => setDados((lista) => (lista ?? []).map((x) => (x.id === n.id ? { ...x, ...n } : x))),
    [setDados],
  )

  /** resposta: 'ok' ("Está tudo bem") ou 'perdido' ("Ele está perdido" → liga o modo perdido). */
  const responder = useCallback(
    async (id, resposta) => {
      const n = await responderNotificacao(id, resposta)
      trocar(n)
      return n
    },
    [trocar],
  )

  const marcarLida = useCallback(async (id) => trocar(await marcarComoLida(id)), [trocar])

  const excluir = useCallback(
    async (id) => {
      await excluirNotificacao(id)
      setDados((lista) => (lista ?? []).filter((x) => x.id !== id))
    },
    [setDados],
  )

  const lista = dados ?? []
  return {
    notificacoes: lista,
    naoLidas: lista.filter((n) => !n.lida).length,
    carregando,
    erro,
    recarregar,
    responder,
    marcarLida,
    excluir,
  }
}
