import { useState } from 'react'
import { Mapa, LegendaMapa } from './Mapa'
import { botao } from '../lib/estilos'
import { LocateFixed } from 'lucide-react'

/**
 * Escolha de um ponto (lat/lng) clicando no mapa ou usando a localização do aparelho.
 * Se `raioKm` for informado, desenha a área de atuação em volta do ponto.
 */
export function SeletorLocal({ valor, aoMudar, raioKm, rotulo = 'Local' }) {
  const [erroGeo, setErroGeo] = useState(null)
  const temPonto =
    Number.isFinite(Number(valor?.lat)) && Number.isFinite(Number(valor?.lng)) && valor?.lat !== ''
  const ponto = temPonto ? { lat: Number(valor.lat), lng: Number(valor.lng) } : null

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setErroGeo('Seu navegador não permite pegar a localização.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setErroGeo(null)
        aoMudar({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setErroGeo('Não foi possível pegar sua localização. Clique no mapa para escolher.'),
    )
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 font-medium text-stone-800">
        {rotulo} <span className="text-rose-700">*</span>
      </legend>
      <p className="text-sm text-stone-600">Clique no mapa para marcar o ponto.</p>
      <Mapa
        altura="h-64"
        centro={ponto ?? undefined}
        aoClicar={aoMudar}
        rotulo={`Mapa para escolher: ${rotulo}`}
        marcadores={ponto ? [{ id: 'ponto', ...ponto, tipo: 'selecionado' }] : []}
        circulos={
          ponto && raioKm
            ? [{ id: 'raio', ...ponto, raioKm: Number(raioKm), tipo: 'selecionado' }]
            : []
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LegendaMapa tipos={['selecionado']} />
        <button type="button" className={botao.fantasma} onClick={usarMinhaLocalizacao}>
          <LocateFixed aria-hidden="true" size={18} />
          Usar minha localização
        </button>
      </div>
      <p className="text-sm text-stone-700" aria-live="polite">
        {ponto
          ? `Ponto escolhido: ${ponto.lat.toFixed(5)}, ${ponto.lng.toFixed(5)}`
          : 'Nenhum ponto escolhido ainda.'}
      </p>
      {erroGeo && <p className="text-sm text-rose-700">{erroGeo}</p>}
    </fieldset>
  )
}
