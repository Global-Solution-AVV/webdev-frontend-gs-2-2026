import { Link } from 'react-router'
import { BadgeStatus } from './BadgeStatus'
import { FotoAnimal } from './FotoAnimal'
import { ESPECIES, dataHora } from '../lib/formatos'
import { cartao } from '../lib/estilos'
import { Clock } from 'lucide-react'

/** Resumo de uma ocorrência de resgate, com o padrão de horários em destaque. */
export function CardOcorrencia({ ocorrencia, link, acoes }) {
  const { dispositivos: ponto, padrao } = ocorrencia
  return (
    <article className={`${cartao} flex flex-col gap-3`}>
      <FotoAnimal
        url={ocorrencia.foto_url}
        alt={`Foto do ${ESPECIES[ocorrencia.especie]?.toLowerCase()} avistado`}
        className="h-32"
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">
          <Link to={link} className="hover:underline">
            {ESPECIES[ocorrencia.especie]} em {ponto?.local_nome ?? 'ponto desconhecido'}
          </Link>
        </h3>
        <BadgeStatus status={ocorrencia.status} />
      </div>
      {padrao && (
        <p className="rounded-lg bg-violet-50 px-3 py-2 font-medium text-violet-900 flex items-center gap-2">
          <Clock aria-hidden="true" size={18} />
          {padrao.texto}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-1 text-sm text-stone-700">
        <dt className="font-medium">Avistamentos</dt>
        <dd>{ocorrencia.total_avistamentos ?? '—'}</dd>
        <dt className="font-medium">Atualizada</dt>
        <dd>{dataHora(ocorrencia.atualizada_em)}</dd>
        {ocorrencia.ongs?.nome && (
          <>
            <dt className="font-medium">ONG</dt>
            <dd>{ocorrencia.ongs.nome}</dd>
          </>
        )}
      </dl>
      {acoes && <div className="mt-auto flex flex-wrap gap-2">{acoes}</div>}
    </article>
  )
}
