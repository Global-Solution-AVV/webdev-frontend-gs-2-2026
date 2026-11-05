// Processamento de uma detecção (regras 1 a 6 da spec).
// Usado pelo endpoint de ingestão (ESP32 / Python) e pelo simulador da coordenação.
import { supabaseAdmin } from './supabase.js'
import { checar } from './http.js'
import { confidenceMinima, DIAS_RECORRENCIA_RESGATE } from './config.js'
import { HttpErro } from './http.js'
import { avaliarDeteccao, podeLiberarPorcao, decidirNotificacao } from './regras/deteccao.js'
import { inicioDoDiaSP } from './regras/datas.js'
import { STATUS, STATUS_FINAIS, deveAbrirOcorrencia } from './regras/ocorrencias.js'
import { registrarHistorico, trocarStatus } from './ocorrencias.js'

const horaCurta = (d) =>
  new Date(d).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  })

async function registrarDeteccao(dispositivo, entrada, resultado, motivo, porcaoLiberada, horario) {
  return checar(
    await supabaseAdmin()
      .from('deteccoes')
      .insert({
        dispositivo_id: dispositivo.id,
        categoria: String(entrada.categoria ?? '').toLowerCase() || '?',
        confidence: Number(entrada.confidence) || 0,
        chip: entrada.chip || null,
        resultado,
        motivo,
        porcao_liberada: porcaoLiberada,
        criado_em: horario,
      })
      .select()
      .single(),
    'Detecção',
  )
}

async function liberarPorcao(dispositivo, horario) {
  const db = supabaseAdmin()
  const { count } = await db
    .from('deteccoes')
    .select('id', { count: 'exact', head: true })
    .eq('dispositivo_id', dispositivo.id)
    .eq('porcao_liberada', true)
    .gte('criado_em', inicioDoDiaSP(horario).toISOString())
  const decisao = podeLiberarPorcao(dispositivo, count ?? 0)
  if (decisao.liberar) {
    checar(
      await db
        .from('dispositivos')
        .update({ estoque_g: Math.max(0, dispositivo.estoque_g - dispositivo.porcao_g) })
        .eq('id', dispositivo.id),
      'Estoque',
    )
  }
  return decisao
}

async function avisarTutor(pet, dispositivo, horario) {
  const tipo = decidirNotificacao(pet, horario)
  if (!tipo) return 'Tutor já foi avisado hoje (modo perdido desligado)'
  const db = supabaseAdmin()
  const mensagem =
    tipo === 'imediato'
      ? `ALERTA: ${pet.nome} (chip ${pet.chip}) foi identificado(a) agora em ${dispositivo.local_nome}, às ${horaCurta(horario)}.`
      : `${pet.nome} (chip ${pet.chip}) passou por ${dispositivo.local_nome} às ${horaCurta(horario)}. Está tudo bem?`
  checar(
    await db.from('notificacoes').insert({
      pet_id: pet.id,
      tutor_id: pet.tutor_id,
      dispositivo_id: dispositivo.id,
      tipo,
      mensagem,
      criado_em: horario,
    }),
    'Notificação',
  )
  checar(await db.from('pets').update({ ultimo_aviso_em: horario }).eq('id', pet.id), 'Pet')
  return `SMS enviado para o tutor do chip ${pet.chip} (${tipo === 'imediato' ? 'modo perdido' : 'aviso diário'})`
}

/** Regras 4 e 6: cria o avistamento e verifica se vira ocorrência de resgate. */
async function registrarAvistamento(dispositivo, especie, deteccaoId, fotoUrl, horario) {
  const db = supabaseAdmin()
  const avistamento = checar(
    await db
      .from('avistamentos')
      .insert({
        dispositivo_id: dispositivo.id,
        deteccao_id: deteccaoId,
        especie,
        foto_url: fotoUrl || null,
        lat: dispositivo.lat,
        lng: dispositivo.lng,
        criado_em: horario,
      })
      .select()
      .single(),
    'Avistamento',
  )

  // Já existe ocorrência em andamento neste ponto para a mesma espécie? Liga o avistamento a ela.
  const emAndamento = checar(
    await db
      .from('ocorrencias')
      .select('*')
      .eq('dispositivo_id', dispositivo.id)
      .eq('especie', especie)
      .not('status', 'in', `(${STATUS_FINAIS.join(',')})`)
      .order('criado_em', { ascending: false })
      .limit(1),
    'Ocorrência',
  )[0]

  if (emAndamento) {
    await db.from('avistamentos').update({ ocorrencia_id: emAndamento.id }).eq('id', avistamento.id)
    if (emAndamento.status === STATUS.NAO_ENCONTRADO) {
      await trocarStatus(emAndamento, STATUS.ABERTA, {
        ongId: null,
        perfilId: null,
        observacao: 'Reaberta: o animal foi avistado de novo no ponto',
        extra: { ong_id: null, reservada_em: null },
      })
    }
    return {
      mensagem: 'Avistamento ligado à ocorrência em andamento',
      ocorrenciaId: emAndamento.id,
    }
  }

  // Regra 6: avistamentos sem tutor em N dias distintos (janela dos últimos N dias) → ocorrência.
  const desde = inicioDoDiaSP(horario, DIAS_RECORRENCIA_RESGATE - 1).toISOString()
  const recentes = checar(
    await db
      .from('avistamentos')
      .select('id, criado_em, reconhecido_por_perdido_id')
      .eq('dispositivo_id', dispositivo.id)
      .eq('especie', especie)
      .is('ocorrencia_id', null)
      .gte('criado_em', desde),
    'Avistamentos',
  )
  if (!deveAbrirOcorrencia(recentes, DIAS_RECORRENCIA_RESGATE)) {
    return { mensagem: 'Avistamento registrado (ainda sem recorrência para resgate)' }
  }

  const ocorrencia = checar(
    await db
      .from('ocorrencias')
      .insert({ dispositivo_id: dispositivo.id, especie, status: STATUS.ABERTA })
      .select()
      .single(),
    'Ocorrência',
  )
  const ids = recentes.filter((a) => !a.reconhecido_por_perdido_id).map((a) => a.id)
  await db.from('avistamentos').update({ ocorrencia_id: ocorrencia.id }).in('id', ids)
  await registrarHistorico({
    ocorrenciaId: ocorrencia.id,
    anterior: null,
    novo: STATUS.ABERTA,
    observacao: `Avistado em ${DIAS_RECORRENCIA_RESGATE} dias seguidos sem tutor identificado`,
  })
  return {
    mensagem: 'Recorrência atingida: ocorrência de resgate aberta',
    ocorrenciaId: ocorrencia.id,
  }
}

/**
 * Processa uma detecção.
 * @param dispositivo linha da tabela dispositivos
 * @param entrada { categoria, confidence, chip?, horario?, foto_url? }
 */
export async function processarDeteccao(dispositivo, entrada) {
  const minima = confidenceMinima()
  if (minima === null) {
    throw new HttpErro(503, 'CONFIDENCE_MINIMA não configurada no servidor (spec §14)')
  }
  const horario = entrada.horario ? new Date(entrada.horario) : new Date()
  if (Number.isNaN(horario.getTime())) throw new HttpErro(422, 'Horário inválido')
  const horarioIso = horario.toISOString()

  // Regra 1: filtro de categoria e confiança.
  const filtro = avaliarDeteccao(entrada, minima)
  if (!filtro.aceita) {
    await registrarDeteccao(dispositivo, entrada, 'descartada', filtro.motivo, false, horarioIso)
    return { resultado: 'descartada', motivo: filtro.motivo, liberar_porcao: false }
  }
  const especie = String(entrada.categoria).toLowerCase()

  // Regra 2: porção (a comida é só a isca para a leitura do chip).
  const porcao = await liberarPorcao(dispositivo, horario)
  const chip = entrada.chip ? String(entrada.chip).replace(/\s/g, '') : null

  // Regra 3: com chip cadastrado → avisa o tutor.
  if (chip) {
    const { data: pet } = await supabaseAdmin()
      .from('pets')
      .select('*')
      .eq('chip', chip)
      .maybeSingle()
    if (pet) {
      const motivo = await avisarTutor(pet, dispositivo, horarioIso)
      await registrarDeteccao(dispositivo, entrada, 'tutor', motivo, porcao.liberar, horarioIso)
      return { resultado: 'tutor', motivo, liberar_porcao: porcao.liberar }
    }
  }

  // Regra 4: sem chip (ou chip sem cadastro) → avistamento.
  const motivoBase = chip ? `Chip ${chip} sem cadastro; registrado como avistamento` : 'Sem chip'
  const det = await registrarDeteccao(
    dispositivo,
    entrada,
    'avistamento',
    motivoBase,
    porcao.liberar,
    horarioIso,
  )
  const av = await registrarAvistamento(dispositivo, especie, det.id, entrada.foto_url, horarioIso)
  return {
    resultado: 'avistamento',
    motivo: `${motivoBase}. ${av.mensagem}`,
    liberar_porcao: porcao.liberar,
    ocorrencia_id: av.ocorrenciaId ?? null,
    ...(porcao.liberar ? {} : { motivo_porcao: porcao.motivo }),
  }
}
