// /api/dispositivos — pontos de identificação (perfil coordenação).
// GET sem login devolve só a localização (para o mapa público).
import { rotas, corpo, checar, exigirId, naoEncontrado } from './_lib/http.js'
import { exigirUsuario, usuarioOpcional, gerarChave, hashChave } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, numero, opcao, coordenadas } from './_lib/validacao.js'
import { estoqueBaixo } from './_lib/regras/deteccao.js'
import { inicioDoDiaSP } from './_lib/regras/datas.js'

const CAMPOS_PUBLICOS = 'id, codigo, local_nome, lat, lng, status'
const CAMPOS_COORDENACAO =
  'id, codigo, local_nome, lat, lng, estoque_g, estoque_minimo_g, limite_porcoes_dia, porcao_g, status, criado_em, api_key_hash'

function validar(dados) {
  return {
    codigo: texto(dados.codigo, 'código', { max: 30 }).toUpperCase(),
    local_nome: texto(dados.local_nome, 'nome do local', { max: 120 }),
    ...coordenadas(dados),
    estoque_g: numero(dados.estoque_g, 'estoque (g)', { min: 0, inteiro: true }),
    estoque_minimo_g: numero(dados.estoque_minimo_g, 'estoque mínimo (g)', {
      min: 0,
      inteiro: true,
    }),
    limite_porcoes_dia: numero(dados.limite_porcoes_dia, 'limite de porções por dia', {
      min: 0,
      max: 1000,
      inteiro: true,
    }),
    porcao_g: numero(dados.porcao_g, 'tamanho da porção (g)', { min: 1, max: 500, inteiro: true }),
    status: opcao(dados.status, 'status', ['ativo', 'manutencao', 'inativo']),
  }
}

// Nunca devolve o hash da chave; só diz se existe.
function semSegredo(d, porcoesHoje = {}) {
  const { api_key_hash, ...resto } = d
  return {
    ...resto,
    tem_chave: Boolean(api_key_hash),
    estoque_baixo: estoqueBaixo(d),
    porcoes_hoje: porcoesHoje[d.id] ?? 0,
  }
}

async function buscar(id) {
  const { data } = await supabaseAdmin()
    .from('dispositivos')
    .select(CAMPOS_COORDENACAO)
    .eq('id', id)
    .maybeSingle()
  if (!data) throw naoEncontrado('Dispositivo')
  return data
}

async function contarPorcoesHoje() {
  const { data } = await supabaseAdmin()
    .from('deteccoes')
    .select('dispositivo_id')
    .eq('porcao_liberada', true)
    .gte('criado_em', inicioDoDiaSP().toISOString())
  const contagem = {}
  for (const d of data ?? []) contagem[d.dispositivo_id] = (contagem[d.dispositivo_id] ?? 0) + 1
  return contagem
}

export default rotas({
  async GET(req) {
    const sessao = await usuarioOpcional(req)
    const db = supabaseAdmin()
    if (sessao?.perfil?.papel !== 'coordenacao') {
      return checar(
        await db
          .from('dispositivos')
          .select(CAMPOS_PUBLICOS)
          .neq('status', 'inativo')
          .order('codigo'),
        'Dispositivos',
      )
    }
    const porcoes = await contarPorcoesHoje()
    if (req.query.id) return semSegredo(await buscar(req.query.id), porcoes)
    const lista = checar(
      await db.from('dispositivos').select(CAMPOS_COORDENACAO).order('codigo'),
      'Dispositivos',
    )
    return lista.map((d) => semSegredo(d, porcoes))
  },

  async POST(req) {
    await exigirUsuario(req, 'coordenacao')
    const criado = checar(
      await supabaseAdmin()
        .from('dispositivos')
        .insert(validar(corpo(req)))
        .select(CAMPOS_COORDENACAO)
        .single(),
      'Dispositivo (código já existe?)',
    )
    return semSegredo(criado)
  },

  async PUT(req) {
    await exigirUsuario(req, 'coordenacao')
    const id = exigirId(req)
    await buscar(id)
    const atualizado = checar(
      await supabaseAdmin()
        .from('dispositivos')
        .update(validar(corpo(req)))
        .eq('id', id)
        .select(CAMPOS_COORDENACAO)
        .single(),
      'Dispositivo (código já existe?)',
    )
    return semSegredo(atualizado)
  },

  // Repor ração no silo.
  async 'POST repor'(req) {
    await exigirUsuario(req, 'coordenacao')
    const id = exigirId(req)
    const atual = await buscar(id)
    const quantidade = numero(corpo(req).quantidade_g, 'quantidade (g)', {
      min: 1,
      max: 100000,
      inteiro: true,
    })
    const atualizado = checar(
      await supabaseAdmin()
        .from('dispositivos')
        .update({ estoque_g: atual.estoque_g + quantidade })
        .eq('id', id)
        .select(CAMPOS_COORDENACAO)
        .single(),
      'Dispositivo',
    )
    return semSegredo(atualizado)
  },

  // Gera uma nova chave de API. Ela é mostrada UMA vez; no banco fica só o hash.
  async 'POST chave'(req) {
    await exigirUsuario(req, 'coordenacao')
    const id = exigirId(req)
    await buscar(id)
    const chave = gerarChave()
    checar(
      await supabaseAdmin()
        .from('dispositivos')
        .update({ api_key_hash: hashChave(chave) })
        .eq('id', id),
      'Dispositivo',
    )
    return { chave }
  },

  async DELETE(req) {
    await exigirUsuario(req, 'coordenacao')
    const id = exigirId(req)
    await buscar(id)
    checar(await supabaseAdmin().from('dispositivos').delete().eq('id', id), 'Dispositivo')
  },
})
