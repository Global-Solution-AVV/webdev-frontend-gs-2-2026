import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

/** Link "Voltar" padronizado, com ícone. */
export function LinkVoltar({ para, children = 'Voltar' }) {
  return (
    <Link
      to={para}
      className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 font-medium text-marca-800 hover:text-marca-900 hover:underline"
    >
      <ArrowLeft aria-hidden="true" size={18} />
      {children}
    </Link>
  )
}
