import { PawPrint } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-20 bg-marca-900 text-marca-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-white">
            <PawPrint aria-hidden="true" size={20} />
            DeVolta
          </p>
          <p className="mt-2 max-w-sm">
            Pontos de identificação que devolvem o animal perdido ao tutor e levam o animal
            abandonado até quem pode resgatá-lo.
          </p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p>Global Solution 2026.2 · FIAP CitizenTech</p>
          <p>Todos os dados desta demonstração são fictícios.</p>
          <p>Mapas © colaboradores do OpenStreetMap.</p>
        </div>
      </div>
    </footer>
  )
}
