import { useState } from 'react'
import { LocateFixed, MapPinned } from 'lucide-react'
import { Link } from 'react-router'
import { useAvistamentos } from '../hooks/useAvistamentos'
import { useAnimaisPerdidos } from '../hooks/useAnimaisPerdidos'
import { useRequisicao } from '../hooks/useRequisicao'
import { listarDispositivos } from '../services/dispositivosService'
import { Mapa, LegendaMapa } from './Mapa'
import { Campo } from './Campo'
import { Alerta } from './Alerta'
import { FotoAnimal } from './FotoAnimal'
import { ESPECIES, dataHora } from '../lib/formatos'
import { botao, cartao } from '../lib/estilos'

/** Mapa público de avistamentos e animais perdidos, com filtros de período, espécie e raio. */
export function PainelMapaPublico({ altura = 'h-[28rem]' }) {
  const [centro, setCentro] = useState(null)
  const [erroGeo, setErroGeo] = useState(null)
  const av = useAvistamentos({ diasIniciais: 7, centro })
  const perdidos = useAnimaisPerdidos({ publico: true, especie: av.especie })
  const pontos = useRequisicao(listarDispositivos, [])

  function pertoDeMim() {
    if (!navigator.geolocation) return setErroGeo('Seu navegador não permite pegar a localização.')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setErroGeo(null)
        setCentro({ lat: p.coords.latitude, lng: p.coords.longitude })
        if (!av.raioKm) av.setRaioKm(3)
      },
      () => setErroGeo('Não foi possível pegar sua localização.'),
    )
  }

  function limparRaio() {
    setCentro(null)
    av.setRaioKm(null)
  }

  const marcadores = [
    ...(pontos.dados ?? []).map((d) => ({
      id: `d-${d.id}`,
      lat: d.lat,
      lng: d.lng,
      tipo: 'dispositivo',
      conteudo: (
        <span>
          <strong>Ponto de identificação {d.codigo}</strong>
          <br />
          {d.local_nome}
        </span>
      ),
    })),
    ...av.avistamentos.map((a) => ({
      id: `a-${a.id}`,
      lat: a.lat,
      lng: a.lng,
      tipo: 'avistamento',
      conteudo: (
        <div className="w-44">
          <FotoAnimal url={a.foto_url} alt={`${ESPECIES[a.especie]} avistado`} className="h-24" />
          <strong>{ESPECIES[a.especie]} avistado</strong>
          <br />
          {a.dispositivos?.local_nome}
          <br />
          {dataHora(a.criado_em)}
        </div>
      ),
    })),
    ...perdidos.perdidos.map((p) => ({
      id: `p-${p.id}`,
      lat: p.lat,
      lng: p.lng,
      tipo: 'perdido',
      conteudo: (
        <span>
          <strong>Procura-se: {p.nome}</strong>
          <br />
          {ESPECIES[p.especie]}
          <br />
          <Link to={`/perdidos/${p.id}`}>Ver detalhes</Link>
        </span>
      ),
    })),
  ]

  const carregando = av.carregando || perdidos.carregando
  return (
    <section className={`${cartao} space-y-4 p-4 sm:p-6`} aria-labelledby="titulo-mapa">
      <div className="flex flex-wrap items-end gap-4">
        <Campo
          rotulo="Período"
          como="select"
          value={av.periodoDias}
          onChange={(e) => av.setPeriodoDias(Number(e.target.value))}
          className="w-48"
        >
          {Object.entries(av.PERIODOS_DIAS).map(([dias, rotulo]) => (
            <option key={dias} value={dias}>
              {rotulo}
            </option>
          ))}
        </Campo>
        <Campo
          rotulo="Espécie"
          como="select"
          value={av.especie}
          onChange={(e) => av.setEspecie(e.target.value)}
          className="w-40"
        >
          <option value="">Todas</option>
          <option value="gato">Gatos</option>
          <option value="cachorro">Cachorros</option>
        </Campo>
        {centro ? (
          <>
            <Campo
              rotulo="Raio"
              como="select"
              value={av.raioKm ?? 3}
              onChange={(e) => av.setRaioKm(Number(e.target.value))}
              className="w-32"
            >
              {[1, 3, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </Campo>
            <button type="button" className={botao.secundario} onClick={limparRaio}>
              <MapPinned aria-hidden="true" size={18} />
              Ver toda a cidade
            </button>
          </>
        ) : (
          <button type="button" className={botao.secundario} onClick={pertoDeMim}>
            <LocateFixed aria-hidden="true" size={18} />
            Perto de mim
          </button>
        )}
      </div>
      {erroGeo && <Alerta tipo="aviso">{erroGeo}</Alerta>}
      <Alerta tipo="erro">{av.erro || perdidos.erro}</Alerta>

      <Mapa
        altura={altura}
        centro={centro ?? undefined}
        marcadores={marcadores}
        circulos={
          centro && av.raioKm
            ? [{ id: 'raio', ...centro, raioKm: av.raioKm, tipo: 'selecionado' }]
            : []
        }
        rotulo="Mapa de avistamentos e animais perdidos"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LegendaMapa tipos={['avistamento', 'perdido', 'dispositivo']} />
        <p className="text-sm text-stone-600" aria-live="polite">
          {carregando
            ? 'Atualizando...'
            : `${av.avistamentos.length} avistamento(s) e ${perdidos.perdidos.length} animal(is) perdido(s)`}
        </p>
      </div>
    </section>
  )
}
