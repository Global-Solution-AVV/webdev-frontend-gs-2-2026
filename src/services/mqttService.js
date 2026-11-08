import mqtt from 'mqtt'

// Broker MQTT público onde os pontos de identificação (ESP32) publicam.
// O navegador conecta direto por WebSocket seguro: funções serverless não mantêm conexão aberta.
export const MQTT_URL = import.meta.env.VITE_MQTT_URL || 'wss://broker.hivemq.com:8884/mqtt'
export const MQTT_PREFIXO = import.meta.env.VITE_MQTT_PREFIXO || 'devolta-gs2026/pontos'

/**
 * Conecta ao broker e assina todos os tópicos dos pontos (<prefixo>/<codigo>/<assunto>).
 *
 * @param {{ aoMensagem: (topico: string, texto: string) => void,
 *           aoStatus: (status: 'conectando'|'conectado'|'desconectado'|'erro') => void }} opcoes
 * @returns {() => void} função que encerra a conexão
 */
export function conectarPontos({ aoMensagem, aoStatus }) {
  aoStatus('conectando')
  const cliente = mqtt.connect(MQTT_URL, {
    clientId: `devolta-painel-${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    connectTimeout: 10_000,
    reconnectPeriod: 5_000,
  })

  cliente.on('connect', () => {
    aoStatus('conectado')
    cliente.subscribe(`${MQTT_PREFIXO}/+/+`)
  })
  cliente.on('reconnect', () => aoStatus('conectando'))
  cliente.on('offline', () => aoStatus('desconectado'))
  cliente.on('error', () => aoStatus('erro'))
  cliente.on('message', (topico, payload) => aoMensagem(topico, payload.toString()))

  return () => cliente.end(true)
}
