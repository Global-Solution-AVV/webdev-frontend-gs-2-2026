import { useState } from 'react'
import { Link } from 'react-router'
import { useMinhaOng } from '../../hooks/useOngs'
import { useOcorrencias } from '../../hooks/useOcorrencias'
import { CardOcorrencia } from '../../components/CardOcorrencia'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { Mapa, LegendaMapa } from '../../components/Mapa'
import { botao, cartao } from '../../lib/estilos'
import { HORAS_RESERVA } from '../../lib/regrasUi'
import { Building2, RefreshCw, Sparkles } from 'lucide-react'

export function OngPainel() {
  const { ong, carregando: carregandoOng, erro: erroOng } = useMinhaOng()
  if (carregandoOng) return <Carregando />
  if (erroOng) return <Alerta tipo="erro">{erroOng}</Alerta>
  if (!ong) {
    return (
      <EstadoVazio titulo="Falta cadastrar os dados da sua ONG" icone={Building2}>
        Informe a área de atuação e as vagas para começar a receber ocorrências.
        <div className="mt-4">
          <Link to="/ong/cadastro" className={botao.primario}>
            Cadastrar ONG
          </Link>
        </div>
      </EstadoVazio>
    )
  }
  return <Painel ong={ong} />
}

function Painel({ ong }) {
  const { abertas, minhas, carregando, erro, recarregar, assumir } = useOcorrencias()
  const [paraAssumir, setParaAssumir] = useState(null)
  const [mensagem, setMensagem] = useState(null)
  const emAtendimento = minhas(ong.id).filter((o) => o.status === 'em_atendimento')
  const finalizadas = minhas(ong.id).filter((o) => o.status !== 'em_atendimento')

  async function confirmarAssumir() {
    try {
      await assumir(paraAssumir.id)
      setMensagem({
        tipo: 'sucesso',
        texto: `Ocorrência assumida! Ela saiu do painel das outras ONGs. Atualize o status em até ${HORAS_RESERVA} h, senão ela volta a ficar aberta.`,
      })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Ocorrências · {ong.nome}</h1>
          <p className="text-stone-700">
            Área de atuação: {Number(ong.raio_km)} km · <strong>{ong.vagas}</strong> vaga(s)
            disponível(is)
          </p>
        </div>
        <button type="button" className={botao.secundario} onClick={recarregar}>
          <RefreshCw aria-hidden="true" size={18} />
          Atualizar
        </button>
      </div>

      {ong.vagas === 0 && (
        <Alerta tipo="aviso">
          Vocês estão com 0 vagas, então não recebem ocorrências novas.{' '}
          <Link to="/ong/cadastro" className="underline">
            Atualize as vagas
          </Link>{' '}
          quando houver espaço.
        </Alerta>
      )}
      {mensagem && (
        <Alerta tipo={mensagem.tipo} aoFechar={() => setMensagem(null)}>
          {mensagem.texto}
        </Alerta>
      )}
      <Alerta tipo="erro">{erro}</Alerta>

      <section aria-labelledby="titulo-abertas" className="space-y-4">
        <h2 id="titulo-abertas" className="text-2xl font-semibold">
          Disponíveis para assumir ({abertas.length})
        </h2>
        <div className={cartao}>
          <Mapa
            altura="h-72"
            centro={{ lat: ong.lat, lng: ong.lng }}
            circulos={[
              {
                id: 'area',
                lat: ong.lat,
                lng: ong.lng,
                raioKm: Number(ong.raio_km),
                tipo: 'dispositivo',
              },
            ]}
            marcadores={[...abertas, ...emAtendimento].map((o) => ({
              id: o.id,
              lat: o.dispositivos.lat,
              lng: o.dispositivos.lng,
              tipo: 'ocorrencia',
              conteudo: `${o.dispositivos.local_nome}${o.padrao ? ` · ${o.padrao.texto}` : ''}`,
            }))}
            rotulo="Mapa das ocorrências na sua área"
          />
          <div className="mt-2">
            <LegendaMapa tipos={['ocorrencia']} />
          </div>
        </div>
        {carregando && !abertas.length ? (
          <Carregando />
        ) : abertas.length === 0 ? (
          <EstadoVazio titulo="Nenhuma ocorrência aberta na sua área" icone={Sparkles} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {abertas.map((o) => (
              <CardOcorrencia
                key={o.id}
                ocorrencia={o}
                link={`/ong/ocorrencias/${o.id}`}
                acoes={
                  <button
                    type="button"
                    className={`${botao.primario} w-full`}
                    onClick={() => setParaAssumir(o)}
                  >
                    Assumir resgate
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-minhas" className="space-y-4">
        <h2 id="titulo-minhas" className="text-2xl font-semibold">
          Em atendimento por vocês ({emAtendimento.length})
        </h2>
        {emAtendimento.length === 0 ? (
          <p className="text-stone-600">Nenhuma ocorrência em atendimento.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {emAtendimento.map((o) => (
              <CardOcorrencia
                key={o.id}
                ocorrencia={o}
                link={`/ong/ocorrencias/${o.id}`}
                acoes={
                  <Link to={`/ong/ocorrencias/${o.id}`} className={`${botao.primario} w-full`}>
                    Atualizar status
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </section>

      {finalizadas.length > 0 && (
        <section aria-labelledby="titulo-finalizadas" className="space-y-4">
          <h2 id="titulo-finalizadas" className="text-xl font-semibold">
            Histórico da ONG
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finalizadas.map((o) => (
              <CardOcorrencia key={o.id} ocorrencia={o} link={`/ong/ocorrencias/${o.id}`} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        aberto={Boolean(paraAssumir)}
        titulo="Assumir este resgate?"
        mensagem={`A ocorrência some do painel das outras ONGs. Se ninguém atualizar o status em ${HORAS_RESERVA} h, ela volta a ficar aberta.`}
        textoConfirmar="Assumir"
        perigo={false}
        aoConfirmar={confirmarAssumir}
        aoFechar={() => setParaAssumir(null)}
      />
    </div>
  )
}
