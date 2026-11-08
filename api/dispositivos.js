// /api/dispositivos — pontos de identificação (perfil coordenação).
// GET sem login devolve só a localização (para o mapa público).
import { rotas, corpo, checar, exigirId, naoEncontrado } from './_lib/http.js'
import { exigirUsuario, usuarioOpcional, gerarChave, hashChave } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto, numero, opcao, coordenadas } from './_lib/validacao.js'
import { estoqueBaixo } from './_lib/regras/leituras.js'
import { inicioDoDiaSP } from './_lib/regras/datas.js'

const CAMPOS_PUBLICOS = 'id, codigo, local_nome, lat, lng, status'
const CAMPOS_COORDENACAO =
  'id, codigo, local_nome, lat, lng, limite_porcoes_dia, status, criado_em, api_key_hash'
const CAMPOS_LEITURA =
  'dispositivo_id, medido_em, nivel_silo_pct, temperatura_c, umidade_pct, estado'

function validar(dados) {
  return {
    codigo: texto(dados.codigo, 'código', { max: 30 }).toUpperCase(),
    local_nome: texto(dados.local_nome, 'nome do local', { max: 120 }),
    ...coordenadas(dados),
    limite_porcoes_dia: numero(dados.limite_porcoes_dia, 'limite de porções por dia', {
      min: 0,
      max: 1000,
      inteiro: true,
    }),
    status: opcao(dados.status, 'status', ['ativo', 'manutencao', 'inativo']),
  }
}

// Nunca devolve o hash da chave; só diz se existe.
// O nível de ração vem da última leitura do sensor (spec §6.4), não de um estoque editado à mão.
function semSegredo(d, porcoesHoje = {}, leituras = {}) {
  const { api_key_hash, ...resto } = d
  const ultima = leituras[d.id] ?? null
  return {
    ...resto,
    tem_chave: Boolean(api_key_hash),
    ultima_leitura: ultima,
    estoque_baixo: estoqueBaixo(ultima),
    porcoes_hoje: porcoesHoje[d.id] ?? 0,
  }
}

const numeroOuNull = (v) => (v === null || v === undefined ? null : Number(v))

async function ultimasLeituras() {
  const { data } = await supabaseAdmin().from('ultima_leitura_dispositivo').select(CAMPOS_LEITURA)
  const mapa = {}
  for (const l of data ?? []) {
    mapa[l.dispositivo_id] = {
      medido_em: l.medido_em,
      nivel_silo_pct: numeroOuNull(l.nivel_silo_pct),
      temperatura_c: numeroOuNull(l.temperatura_c),
      umidade_pct: numeroOuNull(l.umidade_pct),
      estado: l.estado,
    }
  }
  return mapa
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
    const [porcoes, leituras] = await Promise.all([contarPorcoesHoje(), ultimasLeituras()])
    if (req.query.id) return semSegredo(await buscar(req.query.id), porcoes, leituras)
    const lista = checar(
      await db.from('dispositivos').select(CAMPOS_COORDENACAO).order('codigo'),
      'Dispositivos',
    )
    return lista.map((d) => semSegredo(d, porcoes, leituras))
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
    return semSegredo(atualizado, await contarPorcoesHoje(), await ultimasLeituras())
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
