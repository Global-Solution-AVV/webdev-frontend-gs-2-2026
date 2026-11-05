// /api/ongs — cadastro das ONGs. Lista pública sem dados privados.
import { rotas, corpo, checar, exigirId, naoEncontrado, HttpErro } from './_lib/http.js'
import { exigirUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, numero, coordenadas } from './_lib/validacao.js'
import { trocarStatus } from './_lib/ocorrencias.js'
import { STATUS } from './_lib/regras/ocorrencias.js'

const CAMPOS_PUBLICOS = 'id, nome, contato_publico, lat, lng, raio_km, vagas'

function validar(dados) {
  return {
    nome: texto(dados.nome, 'nome', { max: 120 }),
    contato_publico: texto(dados.contato_publico, 'contato público', {
      obrigatorio: false,
      max: 120,
    }),
    ...coordenadas(dados),
    raio_km: numero(dados.raio_km, 'raio de atuação (km)', { min: 0.1, max: 200 }),
    vagas: numero(dados.vagas, 'vagas', { min: 0, max: 10000, inteiro: true }),
  }
}

async function ongEditavel(id, perfil) {
  const { data } = await supabaseAdmin().from('ongs').select('*').eq('id', id).maybeSingle()
  if (!data) throw naoEncontrado('ONG')
  if (perfil.papel !== 'coordenacao' && data.perfil_id !== perfil.id) {
    throw new HttpErro(403, 'Você só pode alterar a sua ONG')
  }
  return data
}

export default rotas({
  async GET(req) {
    const db = supabaseAdmin()
    if (req.query.minha) {
      const { perfil } = await exigirUsuario(req, 'ong')
      const { data } = await db.from('ongs').select('*').eq('perfil_id', perfil.id).maybeSingle()
      return data ?? null
    }
    if (req.query.id) {
      const { data } = await db
        .from('ongs')
        .select(CAMPOS_PUBLICOS)
        .eq('id', req.query.id)
        .maybeSingle()
      if (!data) throw naoEncontrado('ONG')
      return data
    }
    return checar(await db.from('ongs').select(CAMPOS_PUBLICOS).order('nome'), 'ONGs')
  },

  async POST(req) {
    const { perfil } = await exigirUsuario(req, 'ong')
    return checar(
      await supabaseAdmin()
        .from('ongs')
        .insert({ ...validar(corpo(req)), perfil_id: perfil.id })
        .select()
        .single(),
      'ONG (você já cadastrou uma?)',
    )
  },

  async PUT(req) {
    const { perfil } = await exigirUsuario(req, 'ong', 'coordenacao')
    const id = exigirId(req)
    await ongEditavel(id, perfil)
    return checar(
      await supabaseAdmin()
        .from('ongs')
        .update(validar(corpo(req)))
        .eq('id', id)
        .select()
        .single(),
      'ONG',
    )
  },

  async DELETE(req) {
    const { perfil } = await exigirUsuario(req, 'ong', 'coordenacao')
    const id = exigirId(req)
    await ongEditavel(id, perfil)
    // Casos que esta ONG tinha assumido voltam a ficar abertos para as outras.
    const emAtendimento = checar(
      await supabaseAdmin()
        .from('ocorrencias')
        .select('*')
        .eq('ong_id', id)
        .eq('status', STATUS.EM_ATENDIMENTO),
      'Ocorrências',
    )
    for (const oc of emAtendimento) {
      await trocarStatus(oc, STATUS.ABERTA, {
        ongId: null,
        perfilId: perfil.id,
        observacao: 'Reaberta: a ONG responsável saiu da plataforma',
        extra: { ong_id: null, reservada_em: null },
      })
    }
    checar(await supabaseAdmin().from('ongs').delete().eq('id', id), 'ONG')
  },
})
