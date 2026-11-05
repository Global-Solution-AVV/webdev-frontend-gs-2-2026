// Operações de ocorrência que mexem no banco e são usadas por mais de uma função.
import { supabaseAdmin } from './supabase.js'
import { checar, HttpErro } from './http.js'
import { HORAS_EXPIRACAO_RESERVA } from './config.js'
import { STATUS } from './regras/ocorrencias.js'

export async function registrarHistorico({
  ocorrenciaId,
  anterior,
  novo,
  ongId = null,
  perfilId = null,
  observacao = null,
}) {
  checar(
    await supabaseAdmin().from('ocorrencia_historico').insert({
      ocorrencia_id: ocorrenciaId,
      status_anterior: anterior,
      status_novo: novo,
      ong_id: ongId,
      perfil_id: perfilId,
      observacao,
    }),
    'Histórico',
  )
}

/**
 * Regra 9 (checagem na leitura): reabre reservas sem atualização há mais de X horas.
 * O update é condicional, então duas leituras simultâneas não duplicam o histórico.
 */
export async function expirarReservas() {
  const limite = new Date(Date.now() - HORAS_EXPIRACAO_RESERVA * 60 * 60 * 1000).toISOString()
  const reabertas = checar(
    await supabaseAdmin()
      .from('ocorrencias')
      .update({
        status: STATUS.ABERTA,
        ong_id: null,
        reservada_em: null,
        atualizada_em: new Date().toISOString(),
      })
      .eq('status', STATUS.EM_ATENDIMENTO)
      .lt('atualizada_em', limite)
      .select('id, ong_id'),
    'Expirar reservas',
  )
  for (const oc of reabertas) {
    await registrarHistorico({
      ocorrenciaId: oc.id,
      anterior: STATUS.EM_ATENDIMENTO,
      novo: STATUS.ABERTA,
      observacao: `Reserva expirou após ${HORAS_EXPIRACAO_RESERVA} h sem atualização`,
    })
  }
  return reabertas.length
}

/**
 * Troca o status de forma atômica: só atualiza se o status no banco ainda é `de`.
 * Retorna a ocorrência atualizada ou lança 409 se alguém mudou antes.
 */
export async function trocarStatus(ocorrencia, para, { ongId, perfilId, observacao, extra = {} }) {
  const linhas = checar(
    await supabaseAdmin()
      .from('ocorrencias')
      .update({ status: para, atualizada_em: new Date().toISOString(), ...extra })
      .eq('id', ocorrencia.id)
      .eq('status', ocorrencia.status)
      .select(),
    'Ocorrência',
  )
  if (!linhas.length) {
    throw new HttpErro(409, 'Esta ocorrência foi alterada por outra pessoa. Atualize a página.')
  }
  await registrarHistorico({
    ocorrenciaId: ocorrencia.id,
    anterior: ocorrencia.status,
    novo: para,
    ongId: ongId ?? ocorrencia.ong_id ?? null,
    perfilId,
    observacao,
  })
  return linhas[0]
}
