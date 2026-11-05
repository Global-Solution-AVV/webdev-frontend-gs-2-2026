import { dataHora } from '../lib/formatos'
import { botao } from '../lib/estilos'
import { EstadoVazio } from './EstadoVazio'
import { Inbox, MessageCircle, Siren, ThumbsUp } from 'lucide-react'

/** Avisos recebidos pelo tutor ("SMS" mostrado na plataforma). */
export function ListaNotificacoes({ notificacoes, aoResponder, aoMarcarLida, aoExcluir }) {
  if (!notificacoes.length) {
    return (
      <EstadoVazio titulo="Nenhum aviso por enquanto" icone={Inbox}>
        Quando um ponto de identificação ler o chip do seu pet, o aviso aparece aqui.
      </EstadoVazio>
    )
  }
  return (
    <ul className="space-y-3">
      {notificacoes.map((n) => {
        const imediato = n.tipo === 'imediato'
        return (
          <li
            key={n.id}
            className={`rounded-xl border p-4 ${imediato ? 'border-rose-300 bg-rose-50' : 'border-stone-200 bg-white'} ${n.lida ? 'opacity-80' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-600">
                {imediato ? (
                  <Siren aria-hidden="true" size={16} className="mr-1 inline align-[-3px]" />
                ) : (
                  <MessageCircle
                    aria-hidden="true"
                    size={16}
                    className="mr-1 inline align-[-3px]"
                  />
                )}
                {imediato ? 'Alerta de modo perdido' : 'Aviso diário'}{' '}
                {!n.lida && <span className="text-marca-700">· novo</span>}
              </p>
              <time className="text-sm text-stone-600" dateTime={n.criado_em}>
                {dataHora(n.criado_em)}
              </time>
            </div>
            <p className="mt-2 text-stone-900">{n.mensagem}</p>
            <p className="mt-1 text-sm text-stone-600">
              SMS simulado: enviado pelo sistema para o seu telefone cadastrado.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {n.tipo === 'diario' && !n.resposta && (
                <>
                  <button
                    type="button"
                    className={botao.secundario}
                    onClick={() => aoResponder(n.id, 'ok')}
                  >
                    <ThumbsUp aria-hidden="true" size={18} />
                    Está tudo bem
                  </button>
                  <button
                    type="button"
                    className={botao.perigo}
                    onClick={() => aoResponder(n.id, 'perdido')}
                  >
                    Ele está perdido
                  </button>
                </>
              )}
              {n.resposta && (
                <p className="font-medium text-stone-700">
                  Você respondeu:{' '}
                  {n.resposta === 'ok' ? 'Está tudo bem' : 'Ele está perdido (modo perdido ligado)'}
                </p>
              )}
              {n.tipo === 'imediato' && !n.lida && (
                <button
                  type="button"
                  className={botao.secundario}
                  onClick={() => aoMarcarLida(n.id)}
                >
                  Marcar como lido
                </button>
              )}
              <button
                type="button"
                className={`${botao.fantasma} ml-auto`}
                onClick={() => aoExcluir(n.id)}
              >
                Apagar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
