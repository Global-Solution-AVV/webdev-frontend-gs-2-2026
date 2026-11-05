import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarOcorrencias,
  buscarOcorrencia,
  assumirOcorrencia,
  atualizarStatusOcorrencia,
  excluirOcorrencia,
} from '../services/ocorrenciasService'

/**
 * Painel de ocorrências (ONG e coordenação): lista, assume, atualiza status e exclui.
 * A API já filtra o que cada ONG pode ver (raio + vagas) e reabre reservas vencidas.
 */
export function useOcorrencias({ status } = {}) {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(
    () => listarOcorrencias({ status }),
    [status],
  )

  const substituir = useCallback(
    (atualizada) =>
      setDados((lista) =>
        (lista ?? []).map((o) => (o.id === atualizada.id ? { ...o, ...atualizada } : o)),
      ),
    [setDados],
  )

  const assumir = useCallback(
    async (id, observacao) => {
      try {
        const atualizada = await assumirOcorrencia(id, observacao)
        substituir(atualizada)
        return atualizada
      } catch (e) {
        // 409: outra ONG assumiu antes — atualiza a lista para refletir isso.
        if (e.status === 409) recarregar()
        throw e
      }
    },
    [substituir, recarregar],
  )

  const atualizarStatus = useCallback(
    async (id, novoStatus, observacao) => {
      const atualizada = await atualizarStatusOcorrencia(id, novoStatus, observacao)
      substituir(atualizada)
      return atualizada
    },
    [substituir],
  )

  const excluir = useCallback(
    async (id) => {
      await excluirOcorrencia(id)
      setDados((lista) => (lista ?? []).filter((o) => o.id !== id))
    },
    [setDados],
  )

  const lista = dados ?? []
  return {
    ocorrencias: lista,
    abertas: lista.filter((o) => o.status === 'aberta'),
    minhas: (ongId) => lista.filter((o) => o.ong_id === ongId),
    carregando,
    erro,
    recarregar,
    assumir,
    atualizarStatus,
    excluir,
  }
}

/** Uma ocorrência com avistamentos, padrão de horários e histórico. */
export function useOcorrencia(id) {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(
    () => buscarOcorrencia(id),
    [id],
  )

  const executar = useCallback(
    async (acao) => {
      try {
        await acao()
      } finally {
        recarregar() // traz histórico e status atualizados
      }
    },
    [recarregar],
  )

  return {
    ocorrencia: dados,
    carregando,
    erro,
    recarregar,
    setDados,
    assumir: (observacao) => executar(() => assumirOcorrencia(id, observacao)),
    atualizarStatus: (status, observacao) =>
      executar(() => atualizarStatusOcorrencia(id, status, observacao)),
    excluir: () => excluirOcorrencia(id),
  }
}
