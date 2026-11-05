import { Link } from 'react-router'
import { FotoAnimal } from './FotoAnimal'
import { BadgeStatus } from './BadgeStatus'
import { ESPECIES, data } from '../lib/formatos'
import { cartao } from '../lib/estilos'

/** Card de animal perdido. `acoes` permite ao tutor adicionar botões (editar, excluir...). */
export function CardAnimalPerdido({ perdido, link, acoes }) {
  return (
    <article className={`${cartao} flex flex-col gap-3`}>
      <FotoAnimal url={perdido.foto_url} alt={`Foto de ${perdido.nome}`} />
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">
          {link ? (
            <Link to={link} className="hover:underline">
              {perdido.nome}
            </Link>
          ) : (
            perdido.nome
          )}
        </h3>
        <BadgeStatus tipo="perdido" status={perdido.status} />
      </div>
      <p className="text-stone-700">
        {ESPECIES[perdido.especie]} · sumiu em {data(perdido.perdido_em)}
      </p>
      {perdido.descricao && <p className="text-stone-600">{perdido.descricao}</p>}
      {acoes && <div className="mt-auto flex flex-wrap gap-2">{acoes}</div>}
    </article>
  )
}
