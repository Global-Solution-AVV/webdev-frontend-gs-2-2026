import { Link } from 'react-router'
import { Megaphone } from 'lucide-react'
import { FotoAnimal } from './FotoAnimal'
import { ESPECIES } from '../lib/formatos'
import { botao, cartao } from '../lib/estilos'

export function CardPet({ pet, aoAlternarModoPerdido, aoAlternarCartaz, aoExcluir, alternando }) {
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

      <div
        className={`rounded-lg px-3 py-2 ${pet.cartaz_publico ? 'bg-marca-50 text-marca-900' : 'bg-stone-100 text-stone-700'}`}
      >
        <label className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
          <span className="inline-flex items-center gap-2">
            <Megaphone aria-hidden="true" size={16} />
            Cartaz público
          </span>
          <input
            type="checkbox"
            role="switch"
            className="h-5 w-5 accent-marca-700"
            checked={Boolean(pet.cartaz_publico)}
            disabled={alternando}
            onChange={() => aoAlternarCartaz(pet)}
          />
        </label>
        <p className="mt-1 text-sm">
          {pet.cartaz_publico
            ? 'Ligado: enquanto o modo perdido estiver ligado, o cartaz aparece em "Animais perdidos" com seu primeiro nome e seu telefone.'
            : 'Desligado: seu pet e seu telefone não aparecem para o público.'}
        </p>
        {pet.cartaz_publico && pet.modo_perdido && (
          <Link
            to="/cartazes"
            className="mt-1 inline-block text-sm font-semibold text-marca-800 underline"
          >
            Ver cartaz publicado
          </Link>
        )}
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
