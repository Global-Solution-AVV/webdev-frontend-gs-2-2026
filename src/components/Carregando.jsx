import { LoaderCircle } from 'lucide-react'

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-stone-600">
      <LoaderCircle aria-hidden="true" size={22} className="animate-spin text-marca-600" />
      {texto}
    </div>
  )
}
