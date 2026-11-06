// /api/pets — CRUD dos pets com microchip (perfil tutor) e cartazes públicos (sem login).
import { rotas, corpo, checar, exigirId, naoEncontrado, HttpErro } from './_lib/http.js'
import { exigirUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, especie, chip, url, opcao } from './_lib/validacao.js'
import { montarCartaz, SITUACOES_CARTAZ } from './_lib/regras/cartazes.js'

function validar(dados) {
  return {
    nome: texto(dados.nome, 'nome', { max: 80 }),
    especie: especie(dados.especie),
    chip: chip(dados.chip),
    foto_url: url(dados.foto_url),
    cartaz_descricao: texto(dados.cartaz_descricao, 'descrição do cartaz', {
      obrigatorio: false,
      max: 500,
    }),
  }
}

// Cartazes públicos: ?cartazes=1&situacao=perdidos|encontrados&especie=gato|cachorro
async function listarCartazes(query) {
  const situacao = opcao(query.situacao || 'perdidos', 'situação', SITUACOES_CARTAZ)
  let consulta = supabaseAdmin()
    .from('pets')
    .select(
      'id, nome, especie, foto_url, cartaz_descricao, cartaz_publico, modo_perdido, perdido_desde, encontrado_em, perfis(nome, telefone)',
    )
    .eq('cartaz_publico', true)
    .limit(200)
  consulta =
    situacao === 'perdidos'
      ? consulta.eq('modo_perdido', true).order('perdido_desde', { ascending: false })
      : consulta
          .eq('modo_perdido', false)
          .not('encontrado_em', 'is', null)
          .order('encontrado_em', { ascending: false })
  if (query.especie) consulta = consulta.eq('especie', especie(query.especie))
  return checar(await consulta, 'Cartazes')
    .map(montarCartaz)
    .filter(Boolean)
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
    if (req.query.cartazes) return listarCartazes(req.query)
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

  // Liga/desliga o cartaz público. Ligar expõe o telefone do cadastro na aba /cartazes.
  async 'PATCH cartaz'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await petDoTutor(id, perfil.id)
    const ligar = Boolean(corpo(req).cartaz_publico)
    if (ligar && !perfil.telefone) {
      throw new HttpErro(422, 'Cadastre um telefone no seu perfil antes de publicar o cartaz')
    }
    return checar(
      await supabaseAdmin()
        .from('pets')
        .update({ cartaz_publico: ligar })
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
