import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

const TIPOS = {
  erro: { classe: 'border-rose-200 bg-rose-50 text-rose-900', icone: CircleAlert },
  sucesso: { classe: 'border-marca-200 bg-marca-50 text-marca-900', icone: CircleCheck },
  aviso: { classe: 'border-alerta-100 bg-alerta-50 text-alerta-800', icone: TriangleAlert },
  info: { classe: 'border-sky-200 bg-sky-50 text-sky-900', icone: Info },
}

/** Mensagem de erro/sucesso/aviso. Erros são anunciados por leitores de tela. */
export function Alerta({ tipo = 'info', children, aoFechar }) {
  if (!children) return null
  const { classe, icone: Icone } = TIPOS[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${classe}`}
    >
      <Icone aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {aoFechar && (
        <button
          type="button"
          onClick={aoFechar}
          className="-m-1 rounded-full p-1 opacity-70 hover:opacity-100"
          aria-label="Fechar mensagem"
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  )
}
