import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook base: carrega dados com uma função assíncrona e controla carregando/erro.
 * Recarrega quando `deps` mudam ou quando `recarregar()` é chamado.
 *
 * @param {() => Promise<any>} carregar
 * @param {any[]} deps valores que, ao mudar, disparam nova carga
 */
export function useRequisicao(carregar, deps = [], { ativo = true } = {}) {
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: null })
  const [versao, setVersao] = useState(0)
  const carregarRef = useRef(carregar)

  useEffect(() => {
    carregarRef.current = carregar
  })

  const chave = JSON.stringify([...deps, versao])

  useEffect(() => {
    if (!ativo) return undefined
    let vivo = true
    carregarRef
      .current()
      .then((dados) => {
        if (vivo) setEstado({ chave, dados, erro: null })
      })
      .catch((e) => {
        if (vivo) setEstado((s) => ({ chave, dados: s.dados, erro: e.message }))
      })
    return () => {
      vivo = false
    }
  }, [chave, ativo])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  // Permite atualizar a lista localmente depois de criar/editar/excluir, sem novo GET.
  const setDados = useCallback(
    (atualizar) =>
      setEstado((s) => ({
        ...s,
        dados: typeof atualizar === 'function' ? atualizar(s.dados) : atualizar,
      })),
    [],
  )

  return {
    dados: estado.dados,
    erro: estado.erro,
    carregando: ativo && estado.chave !== chave,
    recarregar,
    setDados,
  }
}
