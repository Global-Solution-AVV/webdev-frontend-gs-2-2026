// /api/ocorrencias — painel das ONGs e da coordenação, com o fluxo de status.
import { rotas, corpo, checar, exigirId, naoEncontrado, HttpErro } from './_lib/http.js'
import { exigirUsuario, ongDoUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto } from './_lib/validacao.js'
import { expirarReservas, trocarStatus } from './_lib/ocorrencias.js'
import {
  STATUS,
  ongPodeTransicionar,
  ongPodeVerOcorrencia,
  padraoHorarios,
} from './_lib/regras/ocorrencias.js'

const SELECT_LISTA = '*, dispositivos(codigo, local_nome, lat, lng), ongs(id, nome)'

const ponto = (oc) => ({ lat: oc.dispositivos.lat, lng: oc.dispositivos.lng })

function ongPodeAcessar(ong, oc) {
  if (oc.ong_id === ong.id) return true
  return oc.status === STATUS.ABERTA && ongPodeVerOcorrencia(ong, ponto(oc))
}

async function buscar(id) {
  const { data } = await supabaseAdmin()
    .from('ocorrencias')
    .select(SELECT_LISTA)
    .eq('id', id)
    .maybeSingle()
  if (!data) throw naoEncontrado('Ocorrência')
  return data
}

async function comPadrao(lista) {
  if (!lista.length) return lista
  const { data: avs } = await supabaseAdmin()
    .from('avistamentos')
    .select('ocorrencia_id, criado_em, foto_url')
    .in(
      'ocorrencia_id',
      lista.map((o) => o.id),
    )
  const porOcorrencia = {}
  for (const a of avs ?? []) (porOcorrencia[a.ocorrencia_id] ??= []).push(a)
  return lista.map((o) => {
    const doCaso = porOcorrencia[o.id] ?? []
    return {
      ...o,
      total_avistamentos: doCaso.length,
      foto_url: doCaso.find((a) => a.foto_url)?.foto_url ?? null,
      padrao: padraoHorarios(doCaso),
    }
  })
}

export default rotas({
  async GET(req) {
    const { perfil } = await exigirUsuario(req, 'ong', 'coordenacao')
    await expirarReservas() // regra 9: checagem na leitura
    const db = supabaseAdmin()

    if (req.query.id) {
      const oc = await buscar(req.query.id)
      if (perfil.papel === 'ong') {
        const ong = await ongDoUsuario(perfil.id)
        if (!ongPodeAcessar(ong, oc)) throw naoEncontrado('Ocorrência')
      }
      const [avs, historico] = await Promise.all([
        db
          .from('avistamentos')
          .select('id, especie, foto_url, criado_em')
          .eq('ocorrencia_id', oc.id)
          .order('criado_em', { ascending: false }),
        db
          .from('ocorrencia_historico')
          .select('*, ongs(nome)')
          .eq('ocorrencia_id', oc.id)
          .order('criado_em', { ascending: true }),
      ])
      const avistamentos = checar(avs, 'Avistamentos')
      return {
        ...oc,
        avistamentos,
        historico: checar(historico, 'Histórico'),
        padrao: padraoHorarios(avistamentos),
      }
    }

    let consulta = db
      .from('ocorrencias')
      .select(SELECT_LISTA)
      .order('atualizada_em', { ascending: false })
    if (req.query.status) consulta = consulta.eq('status', req.query.status)
    let lista = checar(await consulta, 'Ocorrências')

    if (perfil.papel === 'ong') {
      const ong = await ongDoUsuario(perfil.id)
      lista = lista.filter((oc) => ongPodeAcessar(ong, oc))
    }
    return comPadrao(lista)
  },

  // A ONG assume a ocorrência (some do painel das outras). Atômico: 409 se outra assumiu antes.
  async 'POST assumir'(req) {
    const { perfil } = await exigirUsuario(req, 'ong')
    await expirarReservas()
    const ong = await ongDoUsuario(perfil.id)
    const oc = await buscar(exigirId(req))
    if (oc.status !== STATUS.ABERTA) throw new HttpErro(409, 'Esta ocorrência já foi assumida')
    if (!ongPodeVerOcorrencia(ong, ponto(oc))) {
      throw new HttpErro(403, 'Fora da sua área de atuação ou sem vagas disponíveis')
    }
    const agora = new Date().toISOString()
    await trocarStatus(oc, STATUS.EM_ATENDIMENTO, {
      ongId: ong.id,
      perfilId: perfil.id,
      observacao: texto(corpo(req).observacao, 'observação', { obrigatorio: false, max: 300 }),
      extra: { ong_id: ong.id, reservada_em: agora },
    })
    return buscar(oc.id)
  },

  // A ONG responsável atualiza o status.
  async 'PATCH status'(req) {
    const { perfil } = await exigirUsuario(req, 'ong')
    await expirarReservas()
    const ong = await ongDoUsuario(perfil.id)
    const oc = await buscar(exigirId(req))
    const dados = corpo(req)
    if (oc.ong_id !== ong.id) throw new HttpErro(403, 'Só a ONG que assumiu pode atualizar')
    if (!ongPodeTransicionar(oc.status, dados.status)) {
      throw new HttpErro(422, `Não é possível ir de "${oc.status}" para "${dados.status}"`)
    }
    await trocarStatus(oc, dados.status, {
      ongId: ong.id,
      perfilId: perfil.id,
      observacao: texto(dados.observacao, 'observação', { obrigatorio: false, max: 300 }),
    })
    if (dados.status === STATUS.RESGATADO) {
      // O animal ocupa uma vaga do abrigo.
      await supabaseAdmin()
        .from('ongs')
        .update({ vagas: Math.max(0, ong.vagas - 1) })
        .eq('id', ong.id)
    }
    return buscar(oc.id)
  },

  async DELETE(req) {
    await exigirUsuario(req, 'coordenacao')
    const id = exigirId(req)
    await buscar(id)
    checar(await supabaseAdmin().from('ocorrencias').delete().eq('id', id), 'Ocorrência')
  },
})
