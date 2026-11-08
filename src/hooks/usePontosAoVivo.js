import { useEffect, useState } from 'react'
import { MQTT_PREFIXO, conectarPontos } from '../services/mqttService'
import {
  adicionarEvento,
  aplicarMensagem,
  interpretarMensagem,
  leituraExibida,
  situacaoDoPonto,
} from '../lib/telemetria'

const INTERVALO_RELOGIO_MS = 5_000

/**
 * Painel ao vivo dos pontos de identificação (coordenação): conecta ao broker MQTT,
 * guarda a última telemetria de cada ponto e os eventos recentes.
 */
export function usePontosAoVivo() {
  const [pontos, setPontos] = useState({})
  const [eventos, setEventos] = useState([])
  const [conexao, setConexao] = useState('conectando')
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(
    () =>
      conectarPontos({
        aoStatus: setConexao,
        aoMensagem: (topico, texto) => {
          const mensagem = interpretarMensagem(MQTT_PREFIXO, topico, texto)
          if (!mensagem) return
          const instante = Date.now()
          setPontos((atual) => aplicarMensagem(atual, mensagem, instante))
          setEventos((atual) => adicionarEvento(atual, mensagem, instante))
          setAgora(instante)
        },
      }),
    [],
  )

  // Relógio para um ponto que parou de publicar passar a "sem sinal".
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), INTERVALO_RELOGIO_MS)
    return () => clearInterval(id)
  }, [])

  return {
    conexao,
    eventos,
    /**
     * Situação de um ponto (online, sem_sinal ou offline) e a leitura a mostrar:
     * ao vivo se estiver online; senão, a última leitura gravada na plataforma.
     */
    doPonto: (codigo, ultimaLeitura) => {
      const situacao = situacaoDoPonto(pontos[codigo], agora)
      return { situacao, leitura: leituraExibida(pontos[codigo], situacao, ultimaLeitura) }
    },
  }
}
