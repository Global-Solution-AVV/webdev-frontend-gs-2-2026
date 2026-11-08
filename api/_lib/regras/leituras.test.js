import { describe, expect, it } from 'vitest'
import { estadoPelasMedidas, estoqueBaixo, siloVazio, validarLeitura } from './leituras.js'

const AGORA = new Date('2026-11-08T13:00:00Z')
const base = { nivel_silo_pct: 64, temperatura_c: 26.1, umidade_pct: 58, estado: 'AGUARDANDO' }

describe('validarLeitura', () => {
  it('aceita uma leitura completa e usa agora quando não há medido_em', () => {
    const r = validarLeitura(base, AGORA)
    expect(r.ok).toBe(true)
    expect(r.dados).toEqual({ ...base, medido_em: AGORA.toISOString() })
  })

  it('aceita medidas nulas se pelo menos uma vier', () => {
    const r = validarLeitura({ nivel_silo_pct: 40, temperatura_c: null, umidade_pct: null }, AGORA)
    expect(r.ok).toBe(true)
    expect(r.dados.temperatura_c).toBeNull()
  })

  it('recusa leitura sem nenhuma medida', () => {
    expect(validarLeitura({ estado: 'AGUARDANDO' }, AGORA).ok).toBe(false)
  })

  it('recusa medidas fora da faixa ou que não são número', () => {
    expect(validarLeitura({ ...base, nivel_silo_pct: 120 }, AGORA).ok).toBe(false)
    expect(validarLeitura({ ...base, temperatura_c: '30' }, AGORA).ok).toBe(false)
    expect(validarLeitura({ ...base, umidade_pct: -1 }, AGORA).ok).toBe(false)
  })

  it('recusa estado desconhecido', () => {
    expect(validarLeitura({ ...base, estado: 'DORMINDO' }, AGORA).ok).toBe(false)
  })

  it('aceita medido_em no passado recente e recusa futuro ou mais de 7 dias', () => {
    const ontem = new Date(AGORA.getTime() - 86400000).toISOString()
    expect(validarLeitura({ ...base, medido_em: ontem }, AGORA).dados.medido_em).toBe(ontem)
    const futuro = new Date(AGORA.getTime() + 10 * 60000).toISOString()
    expect(validarLeitura({ ...base, medido_em: futuro }, AGORA).ok).toBe(false)
    const antigo = new Date(AGORA.getTime() - 8 * 86400000).toISOString()
    expect(validarLeitura({ ...base, medido_em: antigo }, AGORA).ok).toBe(false)
    expect(validarLeitura({ ...base, medido_em: 'ontem' }, AGORA).ok).toBe(false)
  })

  it('arredonda as medidas para uma casa', () => {
    expect(validarLeitura({ ...base, temperatura_c: 26.149 }, AGORA).dados.temperatura_c).toBe(26.1)
  })
})

describe('estoque pela última leitura', () => {
  it('estoque baixo abaixo de 20% e silo vazio abaixo de 5%', () => {
    expect(estoqueBaixo({ nivel_silo_pct: 19.9 })).toBe(true)
    expect(estoqueBaixo({ nivel_silo_pct: 20 })).toBe(false)
    expect(siloVazio({ nivel_silo_pct: 4 })).toBe(true)
    expect(siloVazio({ nivel_silo_pct: 5 })).toBe(false)
  })

  it('sem leitura ou sem nível não gera alerta nem bloqueio', () => {
    expect(estoqueBaixo(null)).toBe(false)
    expect(estoqueBaixo({ nivel_silo_pct: null })).toBe(false)
    expect(siloVazio(undefined)).toBe(false)
  })

  it('o Postgres devolve numeric como texto: também funciona', () => {
    expect(estoqueBaixo({ nivel_silo_pct: '12.0' })).toBe(true)
  })
})

describe('estadoPelasMedidas', () => {
  it('segue a prioridade do ESP32: ração em risco, estoque baixo, aguardando', () => {
    expect(estadoPelasMedidas({ nivel_silo_pct: 10, temperatura_c: 36, umidade_pct: 50 })).toBe(
      'RACAO_EM_RISCO',
    )
    expect(estadoPelasMedidas({ nivel_silo_pct: 10, temperatura_c: 25, umidade_pct: 50 })).toBe(
      'ESTOQUE_BAIXO',
    )
    expect(estadoPelasMedidas({ nivel_silo_pct: 60, temperatura_c: 25, umidade_pct: 50 })).toBe(
      'AGUARDANDO',
    )
  })
})
