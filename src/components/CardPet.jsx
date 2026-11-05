import { Link } from 'react-router'
import { FotoAnimal } from './FotoAnimal'
import { ESPECIES } from '../lib/formatos'
import { botao, cartao } from '../lib/estilos'

export function CardPet({ pet, aoAlternarModoPerdido, aoExcluir, alternando }) {
  return (
    <article className={`${cartao} flex flex-col gap-3`}>
      <FotoAnimal url={pet.foto_url} alt={`Foto de ${pet.nome}`} />
      <div>
        <h3 className="text-lg font-semibold">{pet.nome}</h3>
        <p className="text-stone-700">
          {ESPECIES[pet.especie]} · chip <span className="font-mono">{pet.chip}</span>
        </p>
      </div>

      <div
        className={`rounded-lg px-3 py-2 ${pet.modo_perdido ? 'bg-rose-50 text-rose-900' : 'bg-stone-100 text-stone-700'}`}
      >
        <label className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
          <span>Modo perdido</span>
          <input
            type="checkbox"
            role="switch"
            className="h-5 w-5 accent-rose-700"
            checked={pet.modo_perdido}
            disabled={alternando}
            onChange={() => aoAlternarModoPerdido(pet)}
          />
        </label>
        <p className="mt-1 text-sm">
          {pet.modo_perdido
            ? 'Ligado: você recebe o aviso na hora, com local e horário.'
            : 'Desligado: no máximo um aviso por dia, para você não receber mensagem demais.'}
        </p>
      </div>

      <div className="mt-auto flex gap-2">
        <Link to={`/tutor/pets/${pet.id}`} className={`${botao.secundario} flex-1`}>
          Editar
        </Link>
        <button
          type="button"
          className={`${botao.fantasma} text-rose-800`}
          onClick={() => aoExcluir(pet)}
        >
          Excluir
        </button>
      </div>
    </article>
  )
}
