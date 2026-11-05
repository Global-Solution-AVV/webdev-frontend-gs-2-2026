import { PawPrint } from 'lucide-react'

/** Mensagem para listas vazias. `icone` é um componente do lucide-react. */
export function EstadoVazio({ titulo, children, icone: Icone = PawPrint }) {
  return (
    <div className="rounded-cartao border border-dashed border-marca-200 bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-marca-100 text-marca-700">
        <Icone aria-hidden="true" size={28} />
      </span>
      <p className="mt-4 font-display text-xl font-semibold text-tinta">{titulo}</p>
      {children && <div className="mt-2 text-stone-600">{children}</div>}
    </div>
  )
}
