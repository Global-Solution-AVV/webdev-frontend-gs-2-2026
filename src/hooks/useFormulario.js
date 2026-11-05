import { useCallback, useState } from 'react'

/**
 * Estado de formulário: valores, alteração por campo, envio com carregando/erro.
 * @param {object} inicial valores iniciais
 * @param {(valores: object) => Promise<any>} aoEnviar
 */
export function useFormulario(inicial, aoEnviar) {
  const [valores, setValores] = useState(inicial)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const alterar = useCallback((evento) => {
    const { name, value, type, checked } = evento.target
    setValores((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
  }, [])

  const definir = useCallback((parcial) => setValores((v) => ({ ...v, ...parcial })), [])

  const enviar = useCallback(
    async (evento) => {
      evento?.preventDefault()
      setEnviando(true)
      setErro(null)
      try {
        return await aoEnviar(valores)
      } catch (e) {
        setErro(e.message)
        return undefined
      } finally {
        setEnviando(false)
      }
    },
    [aoEnviar, valores],
  )

  return { valores, alterar, definir, enviar, enviando, erro, setValores }
}
