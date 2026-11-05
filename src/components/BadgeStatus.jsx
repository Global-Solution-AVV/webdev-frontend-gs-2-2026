import { Circle } from 'lucide-react'
import { STATUS_OCORRENCIA, STATUS_DISPOSITIVO, STATUS_PERDIDO } from '../lib/formatos'

const MAPAS = {
  ocorrencia: STATUS_OCORRENCIA,
  dispositivo: STATUS_DISPOSITIVO,
  perdido: STATUS_PERDIDO,
}

/** Status com cor, ícone E texto (nunca só cor), para ser acessível. */
export function BadgeStatus({ status, tipo = 'ocorrencia' }) {
  const info = MAPAS[tipo]?.[status] ?? {
    rotulo: status,
    cor: 'bg-stone-100 text-stone-800 ring-stone-300',
    icone: Circle,
  }
  const Icone = info.icone
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${info.cor}`}
    >
      <Icone aria-hidden="true" size={14} strokeWidth={2.5} />
      {info.rotulo}
    </span>
  )
}
