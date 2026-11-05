const RAIO_TERRA_KM = 6371

const emRadianos = (graus) => (graus * Math.PI) / 180

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a, b) {
  const dLat = emRadianos(b.lat - a.lat)
  const dLng = emRadianos(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(a.lat)) * Math.cos(emRadianos(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h))
}

export function dentroDoRaio(centro, ponto, raioKm) {
  return distanciaKm(centro, ponto) <= Number(raioKm)
}
