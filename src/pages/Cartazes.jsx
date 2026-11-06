import { useState } from 'react'
import { CircleCheck, Megaphone, RefreshCw, Search } from 'lucide-react'
import { useCartazes } from '../hooks/useCartazes'
import { CardCartaz } from '../components/CardCartaz'
import { Carregando } from '../components/Carregando'
import { EstadoVazio } from '../components/EstadoVazio'
import { Alerta } from '../components/Alerta'
import { Campo } from '../components/Campo'
import { botao } from '../lib/estilos'

const SITUACOES = [
  { valor: 'perdidos', texto: 'Procurando', icone: Search },
  { valor: 'encontrados', texto: 'Encontrados', icone: CircleCheck },
]

/** Mural público de cartazes: o equivalente digital aos cartazes colados nos postes. */
export function Cartazes() {
  const [situacao, setSituacao] = useState('perdidos')
  const [especie, setEspecie] = useState('')
  const { cartazes, erro, carregando, recarregar } = useCartazes({ situacao, especie })

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold">Animais perdidos</h1>
        <p className="mt-2 text-stone-700">
          Cartazes publicados pelos próprios tutores. Viu algum desses animais? Entre em contato com
          o tutor.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div
          role="group"
          aria-label="Situação"
          className="inline-flex rounded-full bg-white p-1 shadow-sm"
        >
          {SITUACOES.map(({ valor, texto, icone: Icone }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={situacao === valor}
              onClick={() => setSituacao(valor)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
                situacao === valor ? 'bg-marca-700 text-white' : 'text-marca-900 hover:bg-marca-100'
              }`}
            >
              <Icone aria-hidden="true" size={18} />
              {texto}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Campo
            rotulo="Espécie"
            como="select"
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            className="w-44"
          >
            <option value="">Todas</option>
            <option value="gato">Gatos</option>
            <option value="cachorro">Cachorros</option>
          </Campo>
          <button type="button" className={botao.fantasma} onClick={recarregar}>
            <RefreshCw aria-hidden="true" size={18} />
            <span className="sr-only sm:not-sr-only">Atualizar</span>
          </button>
        </div>
      </div>

      <Alerta tipo="erro">{erro}</Alerta>

      <div aria-live="polite">
        {carregando ? (
          <Carregando />
        ) : cartazes.length === 0 ? (
          <EstadoVazio
            icone={Megaphone}
            titulo={
              situacao === 'perdidos'
                ? 'Nenhum cartaz de animal perdido agora'
                : 'Nenhum reencontro registrado ainda'
            }
          >
            Os cartazes aparecem aqui quando um tutor liga o modo perdido do pet e autoriza a
            publicação.
          </EstadoVazio>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cartazes.map((c) => (
              <CardCartaz key={c.id} cartaz={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
