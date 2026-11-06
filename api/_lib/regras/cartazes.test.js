import { describe, expect, it } from 'vitest'
import { montarCartaz, situacaoDoCartaz } from './cartazes.js'

const base = {
  id: 'p1',
  tutor_id: 't1',
  nome: 'Paçoca',
  especie: 'cachorro',
  chip: '981020000000002',
  foto_url: null,
  cartaz_descricao: 'Coleira azul',
  cartaz_publico: true,
  modo_perdido: true,
  perdido_desde: '2026-11-01T10:00:00Z',
  encontrado_em: null,
  perfis: { nome: 'Ana Souza', telefone: '(11) 90000-0001' },
}

describe('situacaoDoCartaz', () => {
  it('só aparece com autorização do tutor', () => {
    expect(situacaoDoCartaz({ ...base, cartaz_publico: false })).toBeNull()
  })
  it('perdido quando o modo perdido está ligado', () => {
    expect(situacaoDoCartaz(base)).toBe('perdidos')
  })
  it('encontrado quando o modo perdido foi desligado depois de ligado', () => {
    const achado = { ...base, modo_perdido: false, encontrado_em: '2026-11-03T10:00:00Z' }
    expect(situacaoDoCartaz(achado)).toBe('encontrados')
  })
  it('pet que nunca se perdeu não aparece', () => {
    expect(situacaoDoCartaz({ ...base, modo_perdido: false })).toBeNull()
  })
})

describe('montarCartaz', () => {
  it('mostra telefone e primeiro nome do tutor enquanto está perdido', () => {
    const c = montarCartaz(base)
    expect(c.telefone).toBe('(11) 90000-0001')
    expect(c.tutor_nome).toBe('Ana')
  })
  it('nunca expõe chip nem id do tutor', () => {
    const c = montarCartaz(base)
    expect(c).not.toHaveProperty('chip')
    expect(c).not.toHaveProperty('tutor_id')
    expect(c).not.toHaveProperty('perfis')
  })
  it('esconde o telefone depois que o animal foi encontrado', () => {
    const achado = { ...base, modo_perdido: false, encontrado_em: '2026-11-03T10:00:00Z' }
    expect(montarCartaz(achado).telefone).toBeNull()
  })
  it('retorna null quando não deve aparecer', () => {
    expect(montarCartaz({ ...base, cartaz_publico: false })).toBeNull()
  })
})
