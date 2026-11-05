import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { botaoIcone } from '../lib/estilos'

/** Janela modal acessível (usa <dialog> nativo: foco preso e Esc para fechar). */
export function Modal({ aberto, titulo, aoFechar, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      aria-labelledby="titulo-modal"
      className="m-auto w-[min(92vw,32rem)] rounded-cartao bg-creme p-0 text-tinta shadow-xl backdrop:bg-tinta/50"
    >
      {aberto && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="titulo-modal" className="text-2xl font-semibold text-tinta">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={aoFechar}
              className={`${botaoIcone} -m-2 shrink-0`}
              aria-label="Fechar"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
