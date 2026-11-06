import { CalendarDays, CircleCheck, Phone, Search } from 'lucide-react'
import { FotoAnimal } from './FotoAnimal'
import { ESPECIES, data } from '../lib/formatos'
import { botao, cartao } from '../lib/estilos'

/** Só os dígitos, para o link tel: (o número exibido continua formatado). */
const linkTelefone = (tel) => `tel:+55${tel.replace(/\D/g, '')}`

/** Cartaz público de um pet com chip: "procura-se" ou "encontrado". */
export function CardCartaz({ cartaz }) {
  const encontrado = cartaz.situacao === 'encontrados'
  return (
    <article className={`${cartao} flex flex-col gap-3`}>
      <div className="relative">
        <FotoAnimal url={cartaz.foto_url} alt={`Foto de ${cartaz.nome}`} className="h-52" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${
            encontrado ? 'bg-marca-700 text-white' : 'bg-alerta-600 text-white'
          }`}
        >
          {encontrado ? (
            <CircleCheck aria-hidden="true" size={16} />
          ) : (
            <Search aria-hidden="true" size={16} />
          )}
          {encontrado ? 'Encontrado' : 'Procura-se'}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-semibold">{cartaz.nome}</h2>
        <p className="text-stone-700">{ESPECIES[cartaz.especie]} com microchip</p>
      </div>

      {cartaz.descricao && <p className="text-stone-800">{cartaz.descricao}</p>}

      <p className="inline-flex items-center gap-2 text-sm text-stone-700">
        <CalendarDays aria-hidden="true" size={16} />
        {encontrado
          ? `Voltou pra casa em ${data(cartaz.encontrado_em)}`
          : `Desaparecido desde ${data(cartaz.perdido_desde)}`}
      </p>

      {!encontrado && (
        <div className="mt-auto">
          {cartaz.telefone ? (
            <a href={linkTelefone(cartaz.telefone)} className={`${botao.primario} w-full`}>
              <Phone aria-hidden="true" size={18} />
              {cartaz.tutor_nome ? `Falar com ${cartaz.tutor_nome}: ` : 'Ligar: '}
              {cartaz.telefone}
            </a>
          ) : (
            <p className="text-sm text-stone-600">O tutor ainda não informou um telefone.</p>
          )}
        </div>
      )}
    </article>
  )
}
