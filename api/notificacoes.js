// /api/notificacoes — "SMS" simulado para o tutor (mostrado na plataforma).
import { rotas, corpo, checar, exigirId, naoEncontrado } from './_lib/http.js'
import { exigirUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { opcao } from './_lib/validacao.js'

async function daNotificacao(id, tutorId) {
  const { data } = await supabaseAdmin()
    .from('notificacoes')
    .select('*')
    .eq('id', id)
    .eq('tutor_id', tutorId)
    .maybeSingle()
  if (!data) throw naoEncontrado('Notificação')
  return data
}

export default rotas({
  async GET(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    return checar(
      await supabaseAdmin()
        .from('notificacoes')
        .select('*, pets(nome, chip, modo_perdido), dispositivos(local_nome, lat, lng)')
        .eq('tutor_id', perfil.id)
        .order('criado_em', { ascending: false })
        .limit(100),
      'Notificações',
    )
  },

  // Botões do aviso diário: "Está tudo bem" (ok) ou "Ele está perdido" (perdido → liga o modo perdido).
  async 'PATCH resposta'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    const notif = await daNotificacao(id, perfil.id)
    const resposta = opcao(corpo(req).resposta, 'resposta', ['ok', 'perdido'])
    const db = supabaseAdmin()
    if (resposta === 'perdido') {
      checar(await db.from('pets').update({ modo_perdido: true }).eq('id', notif.pet_id), 'Pet')
    }
    return checar(
      await db.from('notificacoes').update({ resposta, lida: true }).eq('id', id).select().single(),
      'Notificação',
    )
  },

  async 'PATCH lida'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await daNotificacao(id, perfil.id)
    return checar(
      await supabaseAdmin()
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id)
        .select()
        .single(),
      'Notificação',
    )
  },

  async DELETE(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await daNotificacao(id, perfil.id)
    checar(await supabaseAdmin().from('notificacoes').delete().eq('id', id), 'Notificação')
  },
})
