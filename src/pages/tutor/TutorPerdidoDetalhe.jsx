import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useAvistamentos } from '../../hooks/useAvistamentos'
import {
  buscarPerdido,
  atualizarPerdido,
  avistamentosProximos,
} from '../../services/perdidosService'
import { FormAnimalPerdido } from '../../components/FormAnimalPerdido'
import { FotoAnimal } from '../../components/FotoAnimal'
import { BadgeStatus } from '../../components/BadgeStatus'
import { Mapa, LegendaMapa } from '../../components/Mapa'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { ESPECIES, data, dataHora } from '../../lib/formatos'
import { botao, cartao } from '../../lib/estilos'
import { CircleCheck, Search } from 'lucide-react'
import { LinkVoltar } from '../../components/LinkVoltar'

/** Animal perdido do tutor: dados, edição e avistamentos próximos para comparar (regra 5). */
export function TutorPerdidoDetalhe() {
  const { id } = useParams()
  const perdido = useRequisicao(() => buscarPerdido(id), [id])
  const proximos = useRequisicao(() => avistamentosProximos(id), [id])
  const { reconhecer } = useAvistamentos({ diasIniciais: 1 })
  const [editando, setEditando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  const p = perdido.dados

  async function salvar(valores) {
    const atualizado = await atualizarPerdido(id, valores)
    perdido.setDados(atualizado)
    setEditando(false)
    proximos.recarregar()
  }

  async function ehOMeu(avistamento) {
    try {
      await reconhecer(avistamento.id, id)
      proximos.setDados((lista) =>
        lista.map((a) => (a.id === avistamento.id ? { ...a, reconhecido_por_perdido_id: id } : a)),
      )
      setMensagem({
        tipo: 'sucesso',
        texto:
          'Avistamento marcado como seu. Se havia um pedido de resgate nesse ponto, ele foi encaminhado a você.',
      })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message })
    }
  }

  if (perdido.carregando) return <Carregando />
  if (perdido.erro) return <Alerta tipo="erro">{perdido.erro}</Alerta>
  if (!p) return null

  const lista = proximos.dados ?? []
  return (
    <div className="space-y-8">
      <LinkVoltar para="/tutor/perdidos" />

      {editando ? (
        <section className={cartao}>
          <h1 className="mb-4 text-2xl font-semibold">Editar {p.nome}</h1>
          <FormAnimalPerdido inicial={p} aoSalvar={salvar} aoCancelar={() => setEditando(false)} />
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-[16rem_1fr]">
          <FotoAnimal url={p.foto_url} alt={`Foto de ${p.nome}`} className="h-56" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold">{p.nome}</h1>
              <BadgeStatus tipo="perdido" status={p.status} />
            </div>
            <p className="text-stone-700">
              {ESPECIES[p.especie]} · sumiu em {data(p.perdido_em)}
            </p>
            {p.descricao && <p>{p.descricao}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" className={botao.secundario} onClick={() => setEditando(true)}>
                Editar dados
              </button>
              <Link to={`/perdidos/${p.id}`} className={botao.fantasma}>
                Ver página pública
              </Link>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-proximos" className="space-y-4">
        <div>
          <h2 id="titulo-proximos" className="text-2xl font-semibold">
            Avistamentos próximos
          </h2>
          <p className="text-stone-700">
            {ESPECIES[p.especie]}s sem chip vistos perto de onde {p.nome} sumiu, desde{' '}
            {data(p.perdido_em)}. Compare as fotos.
          </p>
        </div>
        {mensagem && (
          <Alerta tipo={mensagem.tipo} aoFechar={() => setMensagem(null)}>
            {mensagem.texto}
          </Alerta>
        )}
        <Alerta tipo="erro">{proximos.erro}</Alerta>

        <Mapa
          altura="h-72"
          centro={{ lat: p.lat, lng: p.lng }}
          marcadores={[
            {
              id: 'perdido',
              lat: p.lat,
              lng: p.lng,
              tipo: 'perdido',
              conteudo: `Onde ${p.nome} sumiu`,
            },
            ...lista.map((a) => ({
              id: a.id,
              lat: a.lat,
              lng: a.lng,
              tipo: 'avistamento',
              conteudo: `${a.dispositivos?.local_nome} · ${dataHora(a.criado_em)}`,
            })),
          ]}
          rotulo="Mapa dos avistamentos próximos"
        />
        <LegendaMapa tipos={['perdido', 'avistamento']} />

        {proximos.carregando ? (
          <Carregando texto="Procurando avistamentos..." />
        ) : lista.length === 0 && !proximos.erro ? (
          <EstadoVazio titulo="Nenhum avistamento por perto ainda" icone={Search}>
            Volte mais tarde: novos avistamentos aparecem aqui assim que um ponto de identificação
            registrar.
          </EstadoVazio>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((a) => {
              const meu = a.reconhecido_por_perdido_id === id
              return (
                <li
                  key={a.id}
                  className={`${cartao} space-y-2 ${meu ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  <FotoAnimal
                    url={a.foto_url}
                    alt={`${ESPECIES[a.especie]} avistado`}
                    className="h-36"
                  />
                  <p className="font-semibold">{a.dispositivos?.local_nome}</p>
                  <p className="text-sm text-stone-700">
                    {dataHora(a.criado_em)} · a {a.distancia_km} km
                  </p>
                  {meu ? (
                    <p className="flex items-center gap-1.5 font-semibold text-marca-800">
                      <CircleCheck aria-hidden="true" size={18} />
                      Você reconheceu este avistamento
                    </p>
                  ) : (
                    <button
                      type="button"
                      className={`${botao.primario} w-full`}
                      onClick={() => ehOMeu(a)}
                    >
                      É o meu!
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
