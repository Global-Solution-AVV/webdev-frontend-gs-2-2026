import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { CENTRO_SP } from '../lib/formatos'

// Cores por tipo de marcador. A legenda mostra o significado em texto.
const CORES_MARCADOR = {
  avistamento: '#d98e4a',
  perdido: '#b23a48',
  dispositivo: '#4f6b3a',
  ocorrencia: '#7c5a9e',
  selecionado: '#2f6f8f',
}

function Recentrar({ centro }) {
  const mapa = useMap()
  useEffect(() => {
    if (centro) mapa.setView([centro.lat, centro.lng])
  }, [mapa, centro])
  return null
}

function CliqueNoMapa({ aoClicar }) {
  useMapEvents({ click: (e) => aoClicar({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/**
 * Mapa com OpenStreetMap (React Leaflet).
 * marcadores: [{ id, lat, lng, tipo, conteudo }] · circulos: [{ id, lat, lng, raioKm, tipo }]
 */
export function Mapa({
  marcadores = [],
  circulos = [],
  centro,
  zoom = 13,
  altura = 'h-96',
  aoClicar,
  rotulo = 'Mapa',
}) {
  const inicio = centro ?? CENTRO_SP
  return (
    <div
      className={`${altura} w-full overflow-hidden rounded-2xl border border-creme-escuro`}
      role="region"
      aria-label={rotulo}
    >
      <MapContainer
        center={[inicio.lat, inicio.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="mapa-tiles"
        />
        <Recentrar centro={centro} />
        {aoClicar && <CliqueNoMapa aoClicar={aoClicar} />}
        {circulos.map((c) => (
          <Circle
            key={c.id}
            center={[c.lat, c.lng]}
            radius={c.raioKm * 1000}
            pathOptions={{ color: CORES_MARCADOR[c.tipo] ?? '#4f6b3a', fillOpacity: 0.08 }}
          />
        ))}
        {marcadores.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={m.tipo === 'dispositivo' ? 7 : 9}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: CORES_MARCADOR[m.tipo] ?? '#4f6b3a',
              fillOpacity: 0.95,
            }}
          >
            {m.conteudo && <Popup>{m.conteudo}</Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

/** Legenda em texto para as cores do mapa. */
export function LegendaMapa({ tipos }) {
  const ROTULOS = {
    avistamento: 'Avistamento',
    perdido: 'Animal perdido',
    dispositivo: 'Ponto de identificação',
    ocorrencia: 'Ocorrência',
    selecionado: 'Local escolhido',
  }
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-700"
      aria-label="Legenda do mapa"
    >
      {tipos.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full ring-2 ring-white"
            style={{ backgroundColor: CORES_MARCADOR[t] }}
          />
          {ROTULOS[t]}
        </li>
      ))}
    </ul>
  )
}
