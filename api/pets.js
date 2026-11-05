// /api/pets — CRUD dos pets com microchip (perfil tutor).
import { rotas, corpo, checar, exigirId, naoEncontrado } from './_lib/http.js'
import { exigirUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, especie, chip, url } from './_lib/validacao.js'

function validar(dados) {
  return {
    nome: texto(dados.nome, 'nome', { max: 80 }),
    especie: especie(dados.especie),
    chip: chip(dados.chip),
    foto_url: url(dados.foto_url),
  }
}

async function petDoTutor(id, tutorId) {
  const { data } = await supabaseAdmin()
    .from('pets')
    .select('*')
    .eq('id', id)
    .eq('tutor_id', tutorId)
    .maybeSingle()
  if (!data) throw naoEncontrado('Pet')
  return data
}

export default rotas({
  async GET(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    if (req.query.id) return petDoTutor(req.query.id, perfil.id)
    return checar(
      await supabaseAdmin()
        .from('pets')
        .select('*')
        .eq('tutor_id', perfil.id)
        .order('criado_em', { ascending: false }),
      'Pets',
    )
  },

  async POST(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    return checar(
      await supabaseAdmin()
        .from('pets')
        .insert({ ...validar(corpo(req)), tutor_id: perfil.id })
        .select()
        .single(),
      'Pet (este chip já está cadastrado?)',
    )
  },

  async PUT(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await petDoTutor(id, perfil.id)
    return checar(
      await supabaseAdmin()
        .from('pets')
        .update(validar(corpo(req)))
        .eq('id', id)
        .select()
        .single(),
      'Pet (este chip já está cadastrado?)',
    )
  },

  // Liga/desliga o modo perdido.
  async 'PATCH modo-perdido'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await petDoTutor(id, perfil.id)
    return checar(
      await supabaseAdmin()
        .from('pets')
        .update({ modo_perdido: Boolean(corpo(req).modo_perdido) })
        .eq('id', id)
        .select()
        .single(),
      'Pet',
    )
  },

  async DELETE(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await petDoTutor(id, perfil.id)
    checar(await supabaseAdmin().from('pets').delete().eq('id', id), 'Pet')
  },
})
