import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useOcorrencia } from '../hooks/useOcorrencias'
import { useMinhaOng } from '../hooks/useOngs'
import { useAuth } from '../hooks/useAuth'
import { BadgeStatus } from '../components/BadgeStatus'
import { TimelineHistorico } from '../components/TimelineHistorico'
import { FotoAnimal } from '../components/FotoAnimal'
import { Mapa } from '../components/Mapa'
import { Campo } from '../components/Campo'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Carregando } from '../components/Carregando'
import { Alerta } from '../components/Alerta'
import { ESPECIES, dataHora } from '../lib/formatos'
import { botao, cartao } from '../lib/estilos'
import { HORAS_RESERVA } from '../lib/regrasUi'
import { Clock } from 'lucide-react'
import { LinkVoltar } from '../components/LinkVoltar'

const ACOES_STATUS = [
  { status: 'resgatado', texto: 'Resgatamos o animal', estilo: botao.primario },
  { status: 'nao_encontrado', texto: 'Fomos, mas não estava lá', estilo: botao.secundario },
  { status: 'encaminhado_tutor', texto: 'Encontramos o tutor', estilo: botao.secundario },
]

/** Detalhe de ocorrência para ONG (/ong/ocorrencias/:id) e coordenação (/coordenacao/ocorrencias/:id). */
export function OcorrenciaDetalhe() {
  const { id } = useParams()
  const { perfil } = useAuth()
  const ehOng = perfil?.papel === 'ong'
  const { ong } = useMinhaOngSeOng(ehOng)
  const oc = useOcorrencia(id)
  const navegar = useNavigate()
  const [observacao, setObservacao] = useState('')
  const [mensagem, setMensagem] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function executar(fn, sucesso) {
    setEnviando(true)
    setMensagem(null)
    try {
      await fn()
      setObservacao('')
      setMensagem({ tipo: 'sucesso', texto: sucesso })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message })
    } finally {
      setEnviando(false)
    }
  }

  if (oc.carregando && !oc.ocorrencia) return <Carregando />
  if (oc.erro && !oc.ocorrencia) return <Alerta tipo="erro">{oc.erro}</Alerta>
  const o = oc.ocorrencia
  if (!o) return null

  const voltar = ehOng ? '/ong' : '/coordenacao/ocorrencias'
  const minha = ehOng && ong && o.ong_id === ong.id
  return (
    <div className="space-y-8">
      <LinkVoltar para={voltar} />
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">
          {ESPECIES[o.especie]} em {o.dispositivos?.local_nome}
        </h1>
        <BadgeStatus status={o.status} />
      </header>

      {mensagem && (
        <Alerta tipo={mensagem.tipo} aoFechar={() => setMensagem(null)}>
          {mensagem.texto}
        </Alerta>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {o.padrao && (
            <section className={`${cartao} bg-violet-50`} aria-labelledby="titulo-padrao">
              <h2 id="titulo-padrao" className="text-lg font-semibold text-violet-900">
                Melhor horário para ir
              </h2>
              <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-violet-900">
                <Clock aria-hidden="true" size={24} />
                {o.padrao.texto}
              </p>
              <p className="mt-1 text-violet-900">
                {o.padrao.aparicoes} de {o.avistamentos.length} aparições caíram nessa janela de 2
                horas.
              </p>
            </section>
          )}

          <Mapa
            altura="h-64"
            zoom={16}
            centro={{ lat: o.dispositivos.lat, lng: o.dispositivos.lng }}
            marcadores={[
              {
                id: o.id,
                lat: o.dispositivos.lat,
                lng: o.dispositivos.lng,
                tipo: 'ocorrencia',
                conteudo: o.dispositivos.local_nome,
              },
            ]}
            rotulo="Local da ocorrência"
          />

          <section aria-labelledby="titulo-avs">
            <h2 id="titulo-avs" className="mb-3 text-xl font-semibold">
              Avistamentos ({o.avistamentos.length})
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {o.avistamentos.map((a) => (
                <li key={a.id} className="space-y-1">
                  <FotoAnimal
                    url={a.foto_url}
                    alt={`${ESPECIES[a.especie]} avistado em ${dataHora(a.criado_em)}`}
                    className="h-28"
                  />
                  <p className="text-sm text-stone-700">{dataHora(a.criado_em)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          {ehOng && (o.status === 'aberta' || minha) && (
            <section className={`${cartao} space-y-3`} aria-labelledby="titulo-acoes">
              <h2 id="titulo-acoes" className="text-lg font-semibold">
                O que vocês querem fazer?
              </h2>
              <Campo
                rotulo="Observação (opcional)"
                como="textarea"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                maxLength={300}
              />
              {o.status === 'aberta' && (
                <button
                  type="button"
                  className={`${botao.primario} w-full`}
                  disabled={enviando}
                  onClick={() =>
                    executar(
                      () => oc.assumir(observacao),
                      `Ocorrência assumida. Atualizem o status em até ${HORAS_RESERVA} h.`,
                    )
                  }
                >
                  Assumir resgate
                </button>
              )}
              {o.status === 'em_atendimento' && minha && (
                <>
                  <p className="text-sm text-stone-700">
                    Reservada para vocês desde {dataHora(o.reservada_em)}. Sem atualização em{' '}
                    {HORAS_RESERVA} h, ela volta a ficar aberta.
                  </p>
                  {ACOES_STATUS.map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      className={`${a.estilo} w-full`}
                      disabled={enviando}
                      onClick={() =>
                        executar(
                          () => oc.atualizarStatus(a.status, observacao),
                          'Status atualizado.',
                        )
                      }
                    >
                      {a.texto}
                    </button>
                  ))}
                </>
              )}
            </section>
          )}

          <section className={cartao} aria-labelledby="titulo-hist">
            <h2 id="titulo-hist" className="mb-4 text-lg font-semibold">
              Histórico
            </h2>
            <TimelineHistorico historico={o.historico} />
          </section>

          {perfil?.papel === 'coordenacao' && (
            <button
              type="button"
              className={`${botao.perigo} w-full`}
              onClick={() => setExcluindo(true)}
            >
              Excluir ocorrência
            </button>
          )}
        </aside>
      </div>

      <ConfirmDialog
        aberto={excluindo}
        titulo="Excluir ocorrência?"
        mensagem="A ocorrência e o histórico serão apagados. Os avistamentos continuam no mapa."
        aoConfirmar={async () => {
          await oc.excluir()
          navegar(voltar)
        }}
        aoFechar={() => setExcluindo(false)}
      />
    </div>
  )
}

// A coordenação não tem ONG: só busca quando o perfil é de ONG.
function useMinhaOngSeOng(ehOng) {
  const resultado = useMinhaOng({ ativo: ehOng })
  return ehOng ? resultado : { ong: null }
}
