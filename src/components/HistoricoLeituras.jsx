import { useLeituras } from '../hooks/useLeituras'
import { BadgeStatus } from './BadgeStatus'
import { Carregando } from './Carregando'
import { EstadoVazio } from './EstadoVazio'
import { Alerta } from './Alerta'
import { dataHora } from '../lib/formatos'

const valor = (v, sufixo) => (v === null || v === undefined ? '—' : `${Number(v)}${sufixo}`)

/** Tabela com as últimas leituras gravadas pelo sensor de um ponto. */
export function HistoricoLeituras({ dispositivoId }) {
  const { leituras, erro, carregando } = useLeituras(dispositivoId)

  if (carregando && leituras.length === 0) return <Carregando />
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>
  if (leituras.length === 0) {
    return (
      <EstadoVazio titulo="Nenhuma leitura ainda">
        O ponto grava uma leitura a cada minuto quando está ligado e conectado.
      </EstadoVazio>
    )
  }

  return (
    <div className="max-h-[60vh] overflow-auto rounded-xl border border-stone-200">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">
          Leituras do sensor, da mais recente para a mais antiga
        </caption>
        <thead className="sticky top-0 bg-stone-100 uppercase text-stone-700">
          <tr>
            <th scope="col" className="px-3 py-2">
              Medido em
            </th>
            <th scope="col" className="px-3 py-2">
              Silo
            </th>
            <th scope="col" className="px-3 py-2">
              Temperatura
            </th>
            <th scope="col" className="px-3 py-2">
              Umidade
            </th>
            <th scope="col" className="px-3 py-2">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white">
          {leituras.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2 whitespace-nowrap">{dataHora(l.medido_em)}</td>
              <td className="px-3 py-2">{valor(l.nivel_silo_pct, '%')}</td>
              <td className="px-3 py-2">{valor(l.temperatura_c, ' °C')}</td>
              <td className="px-3 py-2">{valor(l.umidade_pct, '%')}</td>
              <td className="px-3 py-2">
                {l.estado ? <BadgeStatus tipo="ponto" status={l.estado} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
