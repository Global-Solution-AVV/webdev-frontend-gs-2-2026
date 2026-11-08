// Simula o envio de leituras do sensor pelos pontos de identificação, pela mesma API do ESP32
// (POST /api/leituras com X-Device-Key), para os pontos terem histórico na demonstração.
//
// Uso:
//   node scripts/simular-leituras.js                      (API local: http://localhost:3000)
//   node scripts/simular-leituras.js --url https://devolta-avv.vercel.app
//   node scripts/simular-leituras.js --pontos DV-002,DV-004 --horas 48 --intervalo 1
//
// Por padrão envia DV-002 a DV-012 (o DV-001 é o ESP32 do Wokwi), 72 h com uma leitura a cada 2 h.
// Usa as chaves de demonstração do seed (dv_demo_<código>). Rodar de novo adiciona mais leituras.
import { historicoSimulado, PERFIS } from './leiturasSimuladas.js'

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}

const URL_BASE = argumento('url', 'http://localhost:3000').replace(/\/$/, '')
const PONTOS = argumento(
  'pontos',
  Object.keys(PERFIS)
    .filter((c) => c !== 'DV-001')
    .join(','),
).split(',')
const TOTAL_HORAS = Number(argumento('horas', '72'))
const INTERVALO_HORAS = Number(argumento('intervalo', '2'))
const ENVIOS_SIMULTANEOS = 4

async function enviar(codigo, leitura) {
  const resposta = await fetch(`${URL_BASE}/api/leituras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Key': `dv_demo_${codigo}` },
    body: JSON.stringify({ ponto: codigo, ...leitura }),
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}))
    throw new Error(`${codigo} ${leitura.medido_em}: HTTP ${resposta.status} ${corpo.erro ?? ''}`)
  }
}

async function main() {
  const fila = PONTOS.flatMap((codigo) =>
    historicoSimulado(codigo, { totalHoras: TOTAL_HORAS, intervaloHoras: INTERVALO_HORAS }).map(
      (leitura) => ({ codigo, leitura }),
    ),
  )
  console.log(`Enviando ${fila.length} leituras de ${PONTOS.length} pontos para ${URL_BASE} ...`)

  const enviadas = {}
  const erros = []
  let proximo = 0
  async function trabalhador() {
    while (proximo < fila.length) {
      const { codigo, leitura } = fila[proximo++]
      try {
        await enviar(codigo, leitura)
        enviadas[codigo] = (enviadas[codigo] ?? 0) + 1
      } catch (e) {
        erros.push(e.message)
      }
    }
  }
  await Promise.all(Array.from({ length: ENVIOS_SIMULTANEOS }, trabalhador))

  for (const codigo of PONTOS) {
    const ultima = historicoSimulado(codigo, {
      totalHoras: TOTAL_HORAS,
      intervaloHoras: INTERVALO_HORAS,
    }).at(-1)
    console.log(
      `${codigo}: ${enviadas[codigo] ?? 0} leituras · última: silo ${ultima.nivel_silo_pct}%, ` +
        `${ultima.temperatura_c} °C, ${ultima.umidade_pct}% · ${ultima.estado}`,
    )
  }
  if (erros.length) {
    console.error(`\n${erros.length} envio(s) falharam. Primeiros erros:`)
    for (const e of erros.slice(0, 5)) console.error(`  ${e}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
