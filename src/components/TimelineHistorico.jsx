import { BadgeStatus } from './BadgeStatus'
import { dataHora } from '../lib/formatos'

/** Linha do tempo das mudanças de status de uma ocorrência (regra 11). */
export function TimelineHistorico({ historico }) {
  if (!historico?.length) return <p className="text-stone-600">Sem mudanças registradas.</p>
  return (
    <ol className="relative space-y-4 border-l-2 border-stone-200 pl-5">
      {historico.map((h) => (
        <li key={h.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.72rem] top-1.5 h-3 w-3 rounded-full bg-marca-700 ring-4 ring-white"
          />
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus status={h.status_novo} />
            <time className="text-sm text-stone-600" dateTime={h.criado_em}>
              {dataHora(h.criado_em)}
            </time>
          </div>
          <p className="mt-1 text-sm text-stone-700">
            {h.ongs?.nome ? `Por ${h.ongs.nome}` : 'Pelo sistema'}
            {h.observacao ? ` · ${h.observacao}` : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}
