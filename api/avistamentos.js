// /api/avistamentos — mapa público e reconhecimento pelo tutor.
import { rotas, corpo, checar, exigirId, naoEncontrado, HttpErro } from './_lib/http.js'
import { exigirUsuario } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { numero } from './_lib/validacao.js'
import { distanciaKm } from './_lib/regras/geo.js'
import { STATUS, STATUS_FINAIS } from './_lib/regras/ocorrencias.js'
import { trocarStatus } from './_lib/ocorrencias.js'

function dataOpcional(valor, campo) {
  if (!valor) return null
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) throw new HttpErro(422, `${campo} inválida`)
  return d.toISOString()
}

export default rotas({
  // Filtros: ?lat&lng&raio_km (raio), ?desde&ate (período), ?especie
  async GET(req) {
    const q = req.query
    let consulta = supabaseAdmin()
      .from('avistamentos')
      .select(
        'id, especie, foto_url, lat, lng, criado_em, ocorrencia_id, dispositivos(codigo, local_nome)',
      )
      .order('criado_em', { ascending: false })
      .limit(1000)
    const desde = dataOpcional(q.desde, 'Data inicial')
    const ate = dataOpcional(q.ate, 'Data final')
    if (desde) consulta = consulta.gte('criado_em', desde)
    if (ate) consulta = consulta.lte('criado_em', ate)
    if (q.especie) consulta = consulta.eq('especie', q.especie)
    let lista = checar(await consulta, 'Avistamentos')

    if (q.lat && q.lng && q.raio_km) {
      const centro = {
        lat: numero(q.lat, 'latitude', { min: -90, max: 90 }),
        lng: numero(q.lng, 'longitude', { min: -180, max: 180 }),
      }
      const raio = numero(q.raio_km, 'raio (km)', { min: 0.1, max: 500 })
      lista = lista
        .map((a) => ({ ...a, distancia_km: Number(distanciaKm(centro, a).toFixed(2)) }))
        .filter((a) => a.distancia_km <= raio)
    }
    return lista
  },

  // Tutor diz "é o meu" num avistamento: liga ao animal perdido e, se havia ocorrência,
  // ela passa para "Encaminhado ao tutor".
  async 'PATCH reconhecer'(req) {
    const { perfil } = await exigirUsuario(req, 'tutor')
    const id = exigirId(req)
    const perdidoId = corpo(req).perdido_id
    if (!perdidoId) throw new HttpErro(422, 'Informe qual animal perdido é o seu')
    const db = supabaseAdmin()

    const { data: perdido } = await db
      .from('animais_perdidos')
      .select('id, nome, tutor_id')
      .eq('id', perdidoId)
      .eq('tutor_id', perfil.id)
      .maybeSingle()
    if (!perdido) throw naoEncontrado('Animal perdido')

    const { data: avistamento } = await db
      .from('avistamentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (!avistamento) throw naoEncontrado('Avistamento')
    if (
      avistamento.reconhecido_por_perdido_id &&
      avistamento.reconhecido_por_perdido_id !== perdido.id
    ) {
      throw new HttpErro(409, 'Este avistamento já foi reconhecido por outro tutor')
    }

    const atualizado = checar(
      await db
        .from('avistamentos')
        .update({ reconhecido_por_perdido_id: perdido.id })
        .eq('id', id)
        .select()
        .single(),
      'Avistamento',
    )

    if (avistamento.ocorrencia_id) {
      const { data: oc } = await db
        .from('ocorrencias')
        .select('*')
        .eq('id', avistamento.ocorrencia_id)
        .maybeSingle()
      if (oc && !STATUS_FINAIS.includes(oc.status)) {
        await trocarStatus(oc, STATUS.ENCAMINHADO_TUTOR, {
          perfilId: null,
          observacao: `Um tutor reconheceu o animal (${perdido.nome}) em um avistamento`,
        })
      }
    }
    return atualizado
  },
})
