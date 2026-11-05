import { useState } from 'react'
import { useDispositivos } from '../../hooks/useDispositivos'
import { useFormulario } from '../../hooks/useFormulario'
import { useRequisicao } from '../../hooks/useRequisicao'
import { enviarDeteccao, listarDeteccoes } from '../../services/deteccoesService'
import { Campo } from '../../components/Campo'
import { Alerta } from '../../components/Alerta'
import { Carregando } from '../../components/Carregando'
import { dataHora } from '../../lib/formatos'
import { botao, cartao } from '../../lib/estilos'
import { ArrowRight } from 'lucide-react'

const RESULTADOS = {
  tutor: { tipo: 'sucesso', titulo: 'Chip encontrado: tutor avisado' },
  avistamento: { tipo: 'info', titulo: 'Sem chip: avistamento registrado' },
  descartada: { tipo: 'aviso', titulo: 'Detecção descartada' },
}

/**
 * Simula o que o ponto de identificação envia (o mesmo JSON do ESP32 / deteccoes.json do Python).
 * Passa pelas mesmas regras do endpoint de ingestão.
 */
export function CoordSimulador() {
  const { dispositivos, carregando } = useDispositivos()
  const historico = useRequisicao(listarDeteccoes, [])
  const [resultado, setResultado] = useState(null)

  const form = useFormulario(
    { ponto: '', categoria: 'gato', confidence: '0.93', chip: '', foto_url: '', horario: '' },
    async (v) => {
      const payload = {
        ponto: v.ponto,
        categoria: v.categoria,
        confidence: Number(v.confidence),
        chip: v.chip.trim() || null,
        foto_url: v.foto_url.trim() || undefined,
        horario: v.horario ? new Date(v.horario).toISOString() : undefined,
      }
      const r = await enviarDeteccao(payload)
      setResultado({ payload, resposta: r })
      historico.recarregar()
    },
  )
  const { valores, alterar } = form

  if (carregando && !dispositivos.length) return <Carregando />
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Simulador de detecção</h1>
        <p className="text-stone-700">
          Envie uma detecção como se fosse um ponto de identificação. A imagem é analisada no
          próprio aparelho: só chega categoria, confiança e, se houver, o número do chip.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={form.enviar} className={`${cartao} space-y-4`}>
          <Campo
            rotulo="Ponto (dispositivo)"
            como="select"
            name="ponto"
            value={valores.ponto}
            onChange={alterar}
            required
          >
            <option value="">Escolha...</option>
            {dispositivos.map((d) => (
              <option key={d.id} value={d.codigo}>
                {d.codigo} · {d.local_nome}
              </option>
            ))}
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              rotulo="Categoria"
              como="select"
              name="categoria"
              value={valores.categoria}
              onChange={alterar}
            >
              <option value="gato">gato</option>
              <option value="cachorro">cachorro</option>
              <option value="pessoa">pessoa (deve ser descartada)</option>
              <option value="pombo">pombo (deve ser descartada)</option>
            </Campo>
            <Campo
              rotulo={`Confiança: ${Number(valores.confidence).toFixed(2)}`}
              type="range"
              name="confidence"
              min="0"
              max="1"
              step="0.01"
              value={valores.confidence}
              onChange={alterar}
              className="[&_input]:px-0"
            />
          </div>
          <Campo
            rotulo="Número do chip (vazio = sem chip)"
            name="chip"
            value={valores.chip}
            onChange={alterar}
            inputMode="numeric"
            dica="Chips do seed: 981020000000001 (Mingau, modo perdido desligado) e 981020000000002 (Paçoca, modo perdido ligado)."
          />
          <Campo
            rotulo="Link da foto recortada (opcional)"
            type="url"
            name="foto_url"
            value={valores.foto_url}
            onChange={alterar}
          />
          <Campo
            rotulo="Horário (vazio = agora)"
            type="datetime-local"
            name="horario"
            value={valores.horario}
            onChange={alterar}
          />
          <Alerta tipo="erro">{form.erro}</Alerta>
          <button type="submit" className={`${botao.primario} w-full`} disabled={form.enviando}>
            {form.enviando ? 'Enviando...' : 'Enviar detecção'}
          </button>
        </form>

        <div className="space-y-4">
          {resultado ? (
            <section className={`${cartao} space-y-3`} aria-live="polite">
              <Alerta tipo={RESULTADOS[resultado.resposta.resultado]?.tipo ?? 'info'}>
                <p className="font-bold">{RESULTADOS[resultado.resposta.resultado]?.titulo}</p>
                <p>{resultado.resposta.motivo}</p>
                <p className="mt-1">
                  Porção:{' '}
                  {resultado.resposta.liberar_porcao
                    ? 'liberada'
                    : `não liberada${resultado.resposta.motivo_porcao ? ` (${resultado.resposta.motivo_porcao})` : ''}`}
                </p>
              </Alerta>
              <details>
                <summary className="cursor-pointer font-semibold">JSON enviado e recebido</summary>
                <pre className="mt-2 overflow-x-auto rounded bg-stone-900 p-3 text-sm text-stone-100">
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </details>
            </section>
          ) : (
            <p className={`${cartao} text-stone-600`}>O resultado da detecção aparece aqui.</p>
          )}

          <section className={cartao} aria-labelledby="titulo-ultimas">
            <h2 id="titulo-ultimas" className="mb-3 text-lg font-semibold">
              Últimas detecções
            </h2>
            {historico.carregando && !historico.dados ? (
              <Carregando />
            ) : (
              <ul className="max-h-80 divide-y divide-stone-200 overflow-y-auto">
                {(historico.dados ?? []).map((det) => (
                  <li key={det.id} className="py-2 text-sm">
                    <span className="font-semibold">{det.dispositivos?.codigo}</span> ·{' '}
                    {det.categoria} ({Number(det.confidence).toFixed(2)}){' '}
                    <ArrowRight aria-hidden="true" size={14} className="inline align-[-2px]" />
                    <span className="sr-only">resultado:</span>{' '}
                    <span className="font-semibold">{det.resultado}</span>
                    <span className="block text-stone-600">
                      {dataHora(det.criado_em)} · {det.motivo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
