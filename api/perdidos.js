// /api/perdidos — animais perdidos sem chip.
// Público vê os ativos (sem dados do tutor); o tutor gerencia os seus.
import { rotas, corpo, checar, exigirId, naoEncontrado, HttpErro } from './_lib/http.js'
import { exigirUsuario, usuarioOpcional } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, especie, url, coordenadas, opcao } from './_lib/validacao.js'
import { raioComparacaoPerdidosKm } from './_lib/config.js'
import { distanciaKm } from './_lib/regras/geo.js'

// Campos seguros para o público: nunca inclui tutor_id.
const CAMPOS_PUBLICOS =
  'id, nome, especie, descricao, foto_url, lat, lng, status, perdido_em, criado_em'

function validar(dados) {
  const perdidoEm = texto(dados.perdido_em, 'data em que sumiu', { obrigatorio: false, max: 10 })
  if (perdidoEm && !/^\d{4}-\d{2}-\d{2}$/.test(perdidoEm)) {
    throw new HttpErro(422, 'Data em que sumiu inválida')
  }
  return {
    nome: texto(dados.nome, 'nome', { max: 80 }),
    especie: especie(dados.especie),
    descricao: texto(dados.descricao, 'descrição', { obrigatorio: false, max: 500 }),
    foto_url: url(dados.foto_url),
    ...coordenadas(dados),
    ...(perdidoEm ? { perdido_em: perdidoEm } : {}),
    ...(dados.status ? { status: opcao(dados.status, 'status', ['ativo', 'encontrado']) } : {}),
  }
}

async function perdidoDoTutor(id, tutorId) {
  const { data } = await supabaseAdmin()
    .from('animais_perdidos')
    .select('*')
    .eq('id', id)
    .eq('tutor_id', tutorId)
    .maybeSingle()
  if (!data) throw naoEncontrado('Animal perdido')
  return data
}

export default rotas({
  async GET(req) {
    const db = supabaseAdmin()
    // Tutor listando os próprios (?meus=1)
    if (req.query.meus) {
      const { perfil } = await exigirUsuario(req, 'tutor')
      return checar(
        await db
          .from('animais_perdidos')
          .select('*')
          .eq('tutor_id', perfil.id)
          .order('criado_em', { ascending: false }),
        'Animais perdidos',
      )
    }
    if (req.query.id) {
      const sessao = await usuarioOpcional(req)
      const { data } = await db
        .from('animais_perdidos')
        .select('*')
        .eq('id', req.query.id)
        .maybeSingle()
      if (!data) throw naoEncontrado('Animal perdido')
      const ehDono = sessao?.perfil?.id === data.tutor_id
      if (!ehDono && data.status !== 'ativo') throw naoEncontrado('Animal perdido')
      if (ehDono) return { ...data, eh_dono: true }
      const { tutor_id, ...publico } = data
      return publico
    }
    let consulta = db
      .from('animais_perdidos')
      .select(CAMPOS_PUBLICOS)
      .eq('status', 'ativo')
      .order('criado_em', { ascending: false })
      .limit(500)
    if (req.query.especie) consulta = consulta.eq('especie', req.query.especie)
    return checar(await consulta, 'Animais perdidos')
  },

  // Avistamentos próximos para o tutor comparar (regra 5).
  async 'GET avistamentos-proximos'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const perdido = await perdidoDoTutor(exigirId(req), perfil.id)
    const raio = raioComparacaoPerdidosKm()
    if (raio === null) {
      throw new HttpErro(503, 'RAIO_COMPARACAO_PERDIDOS_KM não configurado no servidor (spec §14)')
    }
    const desde = new Date(`${perdido.perdido_em}T00:00:00-03:00`).toISOString()
    const lista = checar(
      await supabaseAdmin()
        .from('avistamentos')
        .select(
          'id, especie, foto_url, lat, lng, criado_em, reconhecido_por_perdido_id, dispositivos(local_nome)',
        )
        .eq('especie', perdido.especie)
        .gte('criado_em', desde)
        .order('criado_em', { ascending: false })
        .limit(1000),
      'Avistamentos',
    )
    return lista
      .map((a) => ({ ...a, distancia_km: Number(distanciaKm(perdido, a).toFixed(2)) }))
      .filter((a) => a.distancia_km <= raio)
      .filter((a) => !a.reconhecido_por_perdido_id || a.reconhecido_por_perdido_id === perdido.id)
  },

  async POST(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    return checar(
      await supabaseAdmin()
        .from('animais_perdidos')
        .insert({ ...validar(corpo(req)), tutor_id: perfil.id })
        .select()
        .single(),
      'Animal perdido',
    )
  },

  async PUT(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await perdidoDoTutor(id, perfil.id)
    return checar(
      await supabaseAdmin()
        .from('animais_perdidos')
        .update(validar(corpo(req)))
        .eq('id', id)
        .select()
        .single(),
      'Animal perdido',
    )
  },

  async DELETE(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    await perdidoDoTutor(id, perfil.id)
    checar(await supabaseAdmin().from('animais_perdidos').delete().eq('id', id), 'Animal perdido')
  },
})
