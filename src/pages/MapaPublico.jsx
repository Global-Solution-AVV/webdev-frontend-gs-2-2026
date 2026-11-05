import { PainelMapaPublico } from '../components/PainelMapaPublico'

export function MapaPublico() {
  return (
    <div className="space-y-4">
      <div>
        <h1 id="titulo-mapa" className="text-3xl font-semibold">
          Mapa de avistamentos
        </h1>
        <p className="mt-1 text-stone-700">
          Veja onde gatos e cachorros sem chip foram vistos pelos pontos de identificação e onde há
          animais sendo procurados. As fotos mostram só o animal.
        </p>
      </div>
      <PainelMapaPublico />
    </div>
  )
}
