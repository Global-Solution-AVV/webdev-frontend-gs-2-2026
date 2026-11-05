import { useState } from 'react'
import { PawPrint } from 'lucide-react'

/** Foto do animal a partir de uma URL; mostra um marcador neutro se não houver foto ou se o link falhar. */
export function FotoAnimal({ url, alt, className = 'h-40' }) {
  const [falhou, setFalhou] = useState(false)
  if (!url || falhou) {
    return (
      <div
        className={`${className} flex w-full items-center justify-center rounded-2xl bg-marca-100 text-marca-400`}
        role="img"
        aria-label={`${alt} (sem foto)`}
      >
        <PawPrint aria-hidden="true" size={44} strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFalhou(true)}
      className={`${className} w-full rounded-2xl object-cover`}
    />
  )
}
