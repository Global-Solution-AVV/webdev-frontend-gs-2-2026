import { Link, useParams } from 'react-router'
import { useRequisicao } from '../hooks/useRequisicao'
import { buscarPerdido } from '../services/perdidosService'
import { Carregando } from '../components/Carregando'
import { Alerta } from '../components/Alerta'
import { FotoAnimal } from '../components/FotoAnimal'
import { BadgeStatus } from '../components/BadgeStatus'
import { Mapa } from '../components/Mapa'
import { ESPECIES, data } from '../lib/formatos'
import { LinkVoltar } from '../components/LinkVoltar'

/** Página pública de um animal perdido. Não mostra nenhum dado do tutor. */
export function PerdidoDetalhe() {
  const { id } = useParams()
  const { dados: p, carregando, erro } = useRequisicao(() => buscarPerdido(id), [id])

  if (carregando) return <Carregando />
  if (erro) return <Alerta tipo="erro">{erro}</Alerta>
  if (!p) return null

  return (
    <article className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <LinkVoltar para="/mapa">Voltar ao mapa</LinkVoltar>
        <FotoAnimal url={p.foto_url} alt={`Foto de ${p.nome}`} className="h-72" />
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">Procura-se: {p.nome}</h1>
          <BadgeStatus tipo="perdido" status={p.status} />
        </div>
        <p className="text-lg text-stone-700">
          {ESPECIES[p.especie]} · sumiu em {data(p.perdido_em)}
        </p>
        {p.descricao && <p className="text-stone-800">{p.descricao}</p>}
        <Alerta tipo="info">
          Viu este animal? Se ele passar por um ponto de identificação, o tutor pode comparar o
          avistamento pela plataforma. Para proteger o tutor, o contato dele não é exibido.
        </Alerta>
        <Mapa
          altura="h-64"
          centro={{ lat: p.lat, lng: p.lng }}
          zoom={15}
          marcadores={[
            { id: p.id, lat: p.lat, lng: p.lng, tipo: 'perdido', conteudo: 'Último local visto' },
          ]}
          rotulo="Último local onde foi visto"
        />
      </div>
    </article>
  )
}
