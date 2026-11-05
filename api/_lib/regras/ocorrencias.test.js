import { describe, it, expect } from 'vitest'
import {
  STATUS,
  ongPodeTransicionar,
  reservaExpirada,
  deveAbrirOcorrencia,
  diasDistintosSemTutor,
  ongPodeVerOcorrencia,
  padraoHorarios,
} from './ocorrencias.js'
import { distanciaKm } from './geo.js'

const av = (iso, extra = {}) => ({ criado_em: iso, ...extra })

describe('transições da ONG', () => {
  it('permite o fluxo previsto', () => {
    expect(ongPodeTransicionar(STATUS.ABERTA, STATUS.EM_ATENDIMENTO)).toBe(true)
    expect(ongPodeTransicionar(STATUS.EM_ATENDIMENTO, STATUS.RESGATADO)).toBe(true)
    expect(ongPodeTransicionar(STATUS.EM_ATENDIMENTO, STATUS.NAO_ENCONTRADO)).toBe(true)
    expect(ongPodeTransicionar(STATUS.EM_ATENDIMENTO, STATUS.ENCAMINHADO_TUTOR)).toBe(true)
  })
  it('bloqueia saltos e volta de status final', () => {
    expect(ongPodeTransicionar(STATUS.ABERTA, STATUS.RESGATADO)).toBe(false)
    expect(ongPodeTransicionar(STATUS.RESGATADO, STATUS.ABERTA)).toBe(false)
  })
})

describe('reservaExpirada (X = 24 h)', () => {
  const agora = new Date('2026-11-12T12:00:00Z')
  it('expira depois de 24 h sem atualização', () => {
    const oc = { status: STATUS.EM_ATENDIMENTO, atualizada_em: '2026-11-11T11:00:00Z' }
    expect(reservaExpirada(oc, agora)).toBe(true)
  })
  it('não expira antes de 24 h nem se não está em atendimento', () => {
    expect(
      reservaExpirada(
        { status: STATUS.EM_ATENDIMENTO, atualizada_em: '2026-11-11T13:00:00Z' },
        agora,
      ),
    ).toBe(false)
    expect(
      reservaExpirada({ status: STATUS.ABERTA, atualizada_em: '2026-11-01T00:00:00Z' }, agora),
    ).toBe(false)
  })
})

describe('recorrência (N = 3 dias)', () => {
  it('conta dias distintos ignorando avistamentos reconhecidos', () => {
    const lista = [
      av('2026-11-08T21:00:00-03:00'),
      av('2026-11-08T22:00:00-03:00'),
      av('2026-11-09T21:30:00-03:00'),
      av('2026-11-10T21:10:00-03:00', { reconhecido_por_perdido_id: 'x' }),
    ]
    expect(diasDistintosSemTutor(lista)).toBe(2)
    expect(deveAbrirOcorrencia(lista, 3)).toBe(false)
    expect(deveAbrirOcorrencia([...lista, av('2026-11-11T21:00:00-03:00')], 3)).toBe(true)
  })
})

describe('visibilidade para ONG', () => {
  const ong = { lat: -23.5614, lng: -46.6559, raio_km: 5, vagas: 2 }
  const perto = { lat: -23.5505, lng: -46.6333 } // ~2,6 km
  const longe = { lat: -23.6821, lng: -46.8755 } // ~25 km
  it('vê se está no raio e tem vaga', () => {
    expect(ongPodeVerOcorrencia(ong, perto)).toBe(true)
  })
  it('não vê fora do raio ou sem vaga', () => {
    expect(ongPodeVerOcorrencia(ong, longe)).toBe(false)
    expect(ongPodeVerOcorrencia({ ...ong, vagas: 0 }, perto)).toBe(false)
  })
  it('haversine dá distância coerente', () => {
    expect(distanciaKm(ong, perto)).toBeGreaterThan(2)
    expect(distanciaKm(ong, perto)).toBeLessThan(3)
  })
})

describe('padraoHorarios', () => {
  it('acha a janela de 2 h com mais aparições', () => {
    const lista = [
      av('2026-11-07T21:10:00-03:00'),
      av('2026-11-08T22:15:00-03:00'),
      av('2026-11-09T21:40:00-03:00'),
      av('2026-11-10T22:05:00-03:00'),
      av('2026-11-10T08:00:00-03:00'),
    ]
    const p = padraoHorarios(lista)
    expect(p.inicio).toBe(21)
    expect(p.fim).toBe(23)
    expect(p.aparicoes).toBe(4)
    expect(p.texto).toBe('Aparece entre 21h e 23h nos últimos 4 dias')
  })
  it('considera a virada da meia-noite', () => {
    const lista = [av('2026-11-08T23:30:00-03:00'), av('2026-11-09T00:20:00-03:00')]
    const p = padraoHorarios(lista)
    expect(p.inicio).toBe(23)
    expect(p.fim).toBe(1)
  })
  it('retorna null sem avistamentos', () => {
    expect(padraoHorarios([])).toBe(null)
  })
})
