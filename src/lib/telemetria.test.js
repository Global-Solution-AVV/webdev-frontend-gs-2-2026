import { describe, expect, it } from 'vitest'
import {
  LIMITE_SEM_SINAL_MS,
  MAX_EVENTOS,
  adicionarEvento,
  aplicarMensagem,
  interpretarMensagem,
  situacaoDoPonto,
  leituraExibida,
  motivosDeAtencao,
} from './telemetria'

const P = 'devolta-gs2026/pontos'
const telemetria = {
  estado: 'AGUARDANDO',
  silo_pct: 64,
  temperatura_c: 26.1,
  umidade_pct: 58,
  ambiente: 'normal',
  porcoes_hoje: 3,
  limite_porcoes_dia: 20,
  fila: 0,
  uptime_s: 45,
}

describe('interpretarMensagem', () => {
  it('lê a telemetria do ponto', () => {
    const m = interpretarMensagem(P, `${P}/DV-001/telemetria`, JSON.stringify(telemetria))
    expect(m.codigo).toBe('DV-001')
    expect(m.assunto).toBe('telemetria')
    expect(m.dados).toMatchObject({
      estado: 'AGUARDANDO',
      siloPct: 64,
      temperaturaC: 26.1,
      umidadePct: 58,
    })
  })

  it('troca números fora da faixa por null', () => {
    const m = interpretarMensagem(
      P,
      `${P}/DV-001/telemetria`,
      JSON.stringify({ ...telemetria, silo_pct: 140, temperatura_c: 'quente', umidade_pct: null }),
    )
    expect(m.dados.siloPct).toBeNull()
    expect(m.dados.temperaturaC).toBeNull()
    expect(m.dados.umidadePct).toBeNull()
  })

  it('aceita conexao online/offline e recusa outros textos', () => {
    expect(interpretarMensagem(P, `${P}/DV-001/conexao`, 'offline').dados).toBe('offline')
    expect(interpretarMensagem(P, `${P}/DV-001/conexao`, 'talvez')).toBeNull()
  })

  it('ignora outro prefixo, assunto desconhecido, código inválido e JSON quebrado', () => {
    expect(interpretarMensagem(P, 'outro/DV-001/telemetria', '{}')).toBeNull()
    expect(interpretarMensagem(P, `${P}/DV-001/senha`, '{}')).toBeNull()
    expect(interpretarMensagem(P, `${P}/dv 001/telemetria`, '{}')).toBeNull()
    expect(interpretarMensagem(P, `${P}/DV-001/telemetria`, '{quebrado')).toBeNull()
    expect(interpretarMensagem(P, `${P}/DV-001/telemetria`, '[1,2]')).toBeNull()
  })

  it('lê evento com chip mascarado e avistamento sem chip', () => {
    const chip = interpretarMensagem(
      P,
      `${P}/DV-001/evento`,
      JSON.stringify({
        tipo: 'chip',
        categoria: 'gato',
        confidence: 0.82,
        chip_mascarado: '981020*****0001',
      }),
    )
    expect(chip.dados).toEqual({
      tipo: 'chip',
      categoria: 'gato',
      confidence: 0.82,
      chipMascarado: '981020*****0001',
    })
    const avist = interpretarMensagem(
      P,
      `${P}/DV-001/evento`,
      JSON.stringify({
        tipo: 'avistamento',
        categoria: 'cachorro',
        confidence: 0.9,
        chip_mascarado: 'x',
      }),
    )
    expect(avist.dados.chipMascarado).toBeNull()
    expect(
      interpretarMensagem(P, `${P}/DV-001/evento`, JSON.stringify({ tipo: 'outro' })),
    ).toBeNull()
  })
})

describe('aplicarMensagem e situacaoDoPonto', () => {
  const tel = interpretarMensagem(P, `${P}/DV-001/telemetria`, JSON.stringify(telemetria))

  it('telemetria recente deixa o ponto online sem alterar o mapa original', () => {
    const original = {}
    const pontos = aplicarMensagem(original, tel, 1_000)
    expect(original).toEqual({})
    expect(pontos['DV-001'].estado).toBe('AGUARDANDO')
    expect(situacaoDoPonto(pontos['DV-001'], 1_000 + LIMITE_SEM_SINAL_MS)).toBe('online')
  })

  it('telemetria velha vira sem sinal; conexao offline vira offline', () => {
    let pontos = aplicarMensagem({}, tel, 1_000)
    expect(situacaoDoPonto(pontos['DV-001'], 1_001 + LIMITE_SEM_SINAL_MS)).toBe('sem_sinal')
    pontos = aplicarMensagem(
      pontos,
      interpretarMensagem(P, `${P}/DV-001/conexao`, 'offline'),
      2_000,
    )
    expect(situacaoDoPonto(pontos['DV-001'], 2_000)).toBe('offline')
  })

  it('ponto desconhecido é offline', () => {
    expect(situacaoDoPonto(undefined, 0)).toBe('offline')
  })

  it('mensagem de estado atualiza estado e detalhe', () => {
    const est = interpretarMensagem(
      P,
      `${P}/DV-001/estado`,
      JSON.stringify({
        estado: 'BLOQUEADO',
        anterior: 'MOVIMENTO',
        detalhe: 'motivo=confidence 0.62 < 0.75',
      }),
    )
    const pontos = aplicarMensagem(aplicarMensagem({}, tel, 0), est, 10)
    expect(pontos['DV-001']).toMatchObject({
      estado: 'BLOQUEADO',
      detalhe: 'motivo=confidence 0.62 < 0.75',
    })
  })
})

describe('eventos', () => {
  it('mantém só os eventos mais recentes, do mais novo para o mais antigo', () => {
    const msg = interpretarMensagem(
      P,
      `${P}/DV-001/evento`,
      JSON.stringify({ tipo: 'avistamento', categoria: 'gato', confidence: 0.8 }),
    )
    let eventos = []
    for (let i = 0; i < MAX_EVENTOS + 3; i++) eventos = adicionarEvento(eventos, msg, i)
    expect(eventos).toHaveLength(MAX_EVENTOS)
    expect(eventos[0].recebidoEm).toBe(MAX_EVENTOS + 2)
  })
})

describe('leituraExibida', () => {
  const tel = interpretarMensagem(P, `${P}/DV-001/telemetria`, JSON.stringify(telemetria))
  const gravada = {
    medido_em: '2026-11-08T14:00:00Z',
    nivel_silo_pct: 12.3,
    temperatura_c: 27.7,
    umidade_pct: 52.7,
    estado: 'ESTOQUE_BAIXO',
  }

  it('ponto online mostra o que chega pelo broker', () => {
    const ponto = aplicarMensagem({}, tel, 1_000)['DV-001']
    const l = leituraExibida(ponto, 'online', gravada)
    expect(l).toMatchObject({ origem: 'ao_vivo', siloPct: 64, medidoEm: 1_000 })
  })

  it('ponto offline mostra a última leitura gravada, mesmo com telemetria retida no broker', () => {
    let pontos = aplicarMensagem({}, interpretarMensagem(P, `${P}/DV-001/conexao`, 'offline'), 0)
    pontos = aplicarMensagem(pontos, tel, 1) // retida chega depois do "offline"
    const situacao = situacaoDoPonto(pontos['DV-001'], 2)
    expect(situacao).toBe('offline')
    expect(leituraExibida(pontos['DV-001'], situacao, gravada)).toMatchObject({
      origem: 'gravada',
      siloPct: 12.3,
      medidoEm: gravada.medido_em,
    })
  })

  it('sem leitura ao vivo nem gravada devolve null', () => {
    expect(leituraExibida(null, 'offline', null)).toBeNull()
  })

  it('o Postgres pode devolver numeric como texto', () => {
    expect(leituraExibida(null, 'offline', { ...gravada, nivel_silo_pct: '40.5' }).siloPct).toBe(
      40.5,
    )
  })
})

describe('motivosDeAtencao', () => {
  it('junta estoque baixo, ração em risco e falha', () => {
    expect(motivosDeAtencao({ siloPct: 12, ambiente: 'risco', estado: 'FALHA' })).toEqual([
      'falha de sensor',
      'estoque baixo (12%)',
      'ração em risco',
    ])
    expect(motivosDeAtencao({ siloPct: 60, ambiente: 'normal', estado: 'AGUARDANDO' })).toEqual([])
    expect(motivosDeAtencao(null)).toEqual([])
  })
})
