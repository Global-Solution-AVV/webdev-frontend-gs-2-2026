import { describe, it, expect } from 'vitest'
import { avaliarDeteccao, podeLiberarPorcao, decidirNotificacao, estoqueBaixo } from './deteccao.js'

// Valor usado só nos testes; o valor real ainda será alinhado com Python e Edge.
const MINIMA = 0.8

describe('avaliarDeteccao', () => {
  it('aceita gato ou cachorro com confiança suficiente', () => {
    expect(avaliarDeteccao({ categoria: 'gato', confidence: 0.93 }, MINIMA).aceita).toBe(true)
    expect(avaliarDeteccao({ categoria: 'Cachorro', confidence: 0.8 }, MINIMA).aceita).toBe(true)
  })
  it('descarta outras categorias', () => {
    const r = avaliarDeteccao({ categoria: 'pessoa', confidence: 0.99 }, MINIMA)
    expect(r.aceita).toBe(false)
    expect(r.motivo).toMatch(/não é gato nem cachorro/)
  })
  it('descarta confiança abaixo do mínimo ou inválida', () => {
    expect(avaliarDeteccao({ categoria: 'gato', confidence: 0.5 }, MINIMA).aceita).toBe(false)
    expect(avaliarDeteccao({ categoria: 'gato', confidence: 'x' }, MINIMA).aceita).toBe(false)
    expect(avaliarDeteccao({ categoria: 'gato', confidence: 1.5 }, MINIMA).aceita).toBe(false)
  })
  it('exige que o mínimo esteja configurado', () => {
    expect(() => avaliarDeteccao({ categoria: 'gato', confidence: 0.9 }, null)).toThrow()
  })
})

describe('podeLiberarPorcao', () => {
  const disp = { status: 'ativo', estoque_g: 1000, porcao_g: 20, limite_porcoes_dia: 5 }
  it('libera quando tudo está ok', () => {
    expect(podeLiberarPorcao(disp, 0).liberar).toBe(true)
  })
  it('bloqueia dispositivo fora de operação, sem estoque ou no limite do dia', () => {
    expect(podeLiberarPorcao({ ...disp, status: 'manutencao' }, 0).liberar).toBe(false)
    expect(podeLiberarPorcao({ ...disp, estoque_g: 10 }, 0).liberar).toBe(false)
    expect(podeLiberarPorcao(disp, 5).liberar).toBe(false)
  })
})

describe('decidirNotificacao', () => {
  const agora = new Date('2026-11-10T22:00:00-03:00')
  it('modo perdido sempre avisa na hora', () => {
    const pet = { modo_perdido: true, ultimo_aviso_em: '2026-11-10T08:00:00-03:00' }
    expect(decidirNotificacao(pet, agora)).toBe('imediato')
  })
  it('sem modo perdido avisa no máximo uma vez por dia', () => {
    expect(decidirNotificacao({ modo_perdido: false, ultimo_aviso_em: null }, agora)).toBe('diario')
    const avisadoHoje = { modo_perdido: false, ultimo_aviso_em: '2026-11-10T00:30:00-03:00' }
    expect(decidirNotificacao(avisadoHoje, agora)).toBe(null)
    const avisadoOntem = { modo_perdido: false, ultimo_aviso_em: '2026-11-09T23:59:00-03:00' }
    expect(decidirNotificacao(avisadoOntem, agora)).toBe('diario')
  })
  it('usa o dia de São Paulo, não o UTC', () => {
    // 02:30 UTC do dia 11 ainda é dia 10 em SP
    const pet = { modo_perdido: false, ultimo_aviso_em: '2026-11-10T12:00:00-03:00' }
    expect(decidirNotificacao(pet, new Date('2026-11-11T02:30:00Z'))).toBe(null)
  })
})

describe('estoqueBaixo', () => {
  it('alerta abaixo do mínimo', () => {
    expect(estoqueBaixo({ estoque_g: 400, estoque_minimo_g: 500 })).toBe(true)
    expect(estoqueBaixo({ estoque_g: 500, estoque_minimo_g: 500 })).toBe(false)
  })
})
