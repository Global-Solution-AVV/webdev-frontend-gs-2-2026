import { Activity, CircleCheck, Search } from 'lucide-react'
import { cartao } from '../lib/estilos'
import { ESPECIES, FUSO } from '../lib/formatos'

const CONEXAO = {
  conectando: { texto: 'Conectando ao broker MQTT…', classe: 'bg-stone-100 text-stone-800' },
  conectado: { texto: 'Conectado ao broker MQTT', classe: 'bg-emerald-100 text-emerald-900' },
  desconectado: {
    texto: 'Sem conexão com o broker; tentando de novo',
    classe: 'bg-alerta-100 text-alerta-800',
  },
  erro: {
    texto: 'Erro na conexão com o broker; tentando de novo',
    classe: 'bg-rose-100 text-rose-900',
  },
}

function hora(ms) {
  return new Date(ms).toLocaleTimeString('pt-BR', { timeZone: FUSO })
}

/** Status da conexão com o broker e últimos eventos publicados pelos pontos. */
export function PainelAoVivo({ conexao, eventos }) {
  const status = CONEXAO[conexao] ?? CONEXAO.conectando
  return (
    <section className={cartao} aria-labelledby="titulo-ao-vivo">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-ao-vivo" className="flex items-center gap-2 text-xl font-semibold">
          <Activity aria-hidden="true" size={20} />
          Ao vivo
        </h2>
        <p
          role="status"
          className={`rounded-full px-3 py-1 text-sm font-semibold ${status.classe}`}
        >
          {status.texto}
        </p>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Leituras que os pontos publicam a cada 5 segundos: estado, nível do silo e conservação da
        ração.
      </p>

      <h3 className="mt-4 font-semibold">Últimos eventos</h3>
      {eventos.length === 0 ? (
        <p className="mt-1 text-stone-600">Nenhum evento desde que a página foi aberta.</p>
      ) : (
        <ul className="mt-2 divide-y divide-stone-200" aria-live="polite">
          {eventos.map((e) => {
            const Icone = e.tipo === 'chip' ? CircleCheck : Search
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <span className="font-mono text-stone-600">{hora(e.recebidoEm)}</span>
                <span className="font-semibold">{e.codigo}</span>
                <span className="flex items-center gap-1.5">
                  <Icone aria-hidden="true" size={14} />
                  {e.tipo === 'chip'
                    ? `Chip lido (${e.chipMascarado ?? '—'})`
                    : 'Avistamento sem chip'}
                </span>
                <span className="text-stone-700">
                  {ESPECIES[e.categoria] ?? e.categoria}
                  {e.confidence !== null && ` · confiança ${e.confidence.toFixed(2)}`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
