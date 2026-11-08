import { Droplets, Gauge, Thermometer, Wifi, WifiOff } from 'lucide-react'
import { BadgeStatus } from './BadgeStatus'
import { NIVEL_BAIXO_PCT } from '../lib/telemetria'

const SITUACOES = {
  online: { rotulo: 'Ao vivo', classe: 'text-emerald-800', icone: Wifi },
  sem_sinal: { rotulo: 'Sem sinal', classe: 'text-alerta-800', icone: WifiOff },
  offline: { rotulo: 'Offline', classe: 'text-stone-600', icone: WifiOff },
}

const AMBIENTE = { atencao: ' (atenção)', risco: ' (risco)' }

const mostrar = (v, sufixo) => (v === null || v === undefined ? '—' : `${v}${sufixo}`)

/**
 * Leitura do sensor de um ponto, de uma fonte só: ao vivo (broker MQTT) quando o ponto está
 * online; senão, a última leitura gravada na plataforma (a data aparece na coluna Status).
 */
export function LeituraSensor({ situacao, leitura }) {
  const info = SITUACOES[situacao]
  const Icone = info.icone
  const baixo = leitura?.siloPct !== null && leitura?.siloPct < NIVEL_BAIXO_PCT

  return (
    <div className="space-y-1.5 text-sm">
      <p className={`flex items-center gap-1.5 font-semibold ${info.classe}`}>
        <Icone aria-hidden="true" size={16} />
        {info.rotulo}
      </p>
      {!leitura ? (
        <p className="text-stone-600">Sem leituras</p>
      ) : (
        <>
          {leitura.estado && <BadgeStatus tipo="ponto" status={leitura.estado} />}
          <ul className="space-y-0.5 text-stone-700">
            <li className={`flex items-center gap-1.5 ${baixo ? 'font-bold text-rose-800' : ''}`}>
              <Gauge aria-hidden="true" size={14} />
              Silo: {mostrar(leitura.siloPct, '%')}
              {baixo && ' · baixo'}
            </li>
            <li className="flex items-center gap-1.5">
              <Thermometer aria-hidden="true" size={14} />
              {mostrar(leitura.temperaturaC, ' °C')}
              {AMBIENTE[leitura.ambiente] ?? ''}
            </li>
            <li className="flex items-center gap-1.5">
              <Droplets aria-hidden="true" size={14} />
              Umidade: {mostrar(leitura.umidadePct, '%')}
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
