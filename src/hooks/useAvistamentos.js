import { useCallback, useMemo, useState } from 'react'
import { useRequisicao } from './useRequisicao'
import { listarAvistamentos, reconhecerAvistamento } from '../services/avistamentosService'

const PERIODOS_DIAS = { 1: 'Últimas 24 horas', 7: 'Últimos 7 dias', 30: 'Últimos 30 dias' }

/**
 * Avistamentos com filtro por raio (centro + km) e por período (últimos N dias).
 * Também permite ao tutor reconhecer um avistamento como o seu animal perdido.
 */
export function useAvistamentos({ diasIniciais = 7, raioInicialKm = null, centro = null } = {}) {
  const [periodoDias, setPeriodoDias] = useState(diasIniciais)
  const [raioKm, setRaioKm] = useState(raioInicialKm)
  const [especie, setEspecie] = useState('')

  const filtros = useMemo(() => {
    // Arredonda o "desde" para a hora, para o filtro não mudar a cada render.
    const agora = new Date()
    agora.setMinutes(0, 0, 0)
    const desde = new Date(agora.getTime() - periodoDias * 24 * 60 * 60 * 1000).toISOString()
    const f = { desde, especie }
    if (centro && raioKm) Object.assign(f, { lat: centro.lat, lng: centro.lng, raio_km: raioKm })
    return f
  }, [periodoDias, especie, centro, raioKm])

  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(
    () => listarAvistamentos(filtros),
    [filtros],
  )

  const reconhecer = useCallback(
    async (avistamentoId, perdidoId) => {
      const atualizado = await reconhecerAvistamento(avistamentoId, perdidoId)
      setDados((lista) =>
        (lista ?? []).map((a) => (a.id === atualizado.id ? { ...a, ...atualizado } : a)),
      )
      return atualizado
    },
    [setDados],
  )

  return {
    avistamentos: dados ?? [],
    carregando,
    erro,
    recarregar,
    reconhecer,
    periodoDias,
    setPeriodoDias,
    raioKm,
    setRaioKm,
    especie,
    setEspecie,
    PERIODOS_DIAS,
  }
}
