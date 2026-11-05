import { createHash, randomBytes } from 'node:crypto'
import { supabaseAdmin } from './supabase.js'
import { HttpErro } from './http.js'

function tokenDoCabecalho(req) {
  const cab = req.headers?.authorization ?? ''
  const [tipo, token] = cab.split(' ')
  return tipo === 'Bearer' && token ? token : null
}

/** Retorna { usuario, perfil } se houver token válido, ou null. */
export async function usuarioOpcional(req) {
  const token = tokenDoCabecalho(req)
  if (!token) return null
  const db = supabaseAdmin()
  const { data, error } = await db.auth.getUser(token)
  if (error || !data?.user) return null
  const { data: perfil } = await db.from('perfis').select('*').eq('id', data.user.id).maybeSingle()
  return { usuario: data.user, perfil }
}

/** Exige login (e, se informado, um dos papéis). */
export async function exigirUsuario(req, ...papeis) {
  const sessao = await usuarioOpcional(req)
  if (!sessao) throw new HttpErro(401, 'Faça login para continuar')
  if (!sessao.perfil) throw new HttpErro(403, 'Perfil não encontrado. Complete o cadastro.')
  if (papeis.length && !papeis.includes(sessao.perfil.papel)) {
    throw new HttpErro(403, 'Seu perfil não tem acesso a esta ação')
  }
  return sessao
}

/** Busca a ONG do perfil logado (perfil de papel "ong"). */
export async function ongDoUsuario(perfilId, { obrigatoria = true } = {}) {
  const { data } = await supabaseAdmin()
    .from('ongs')
    .select('*')
    .eq('perfil_id', perfilId)
    .maybeSingle()
  if (!data && obrigatoria) throw new HttpErro(409, 'Cadastre os dados da sua ONG primeiro')
  return data
}

// ---------- Chave de API dos dispositivos ----------

export const hashChave = (chave) => createHash('sha256').update(chave).digest('hex')

export function gerarChave() {
  return `dv_${randomBytes(18).toString('base64url')}`
}

/** Autentica o dispositivo pelo cabeçalho X-Device-Key. Retorna o dispositivo ou null. */
export async function dispositivoPelaChave(req) {
  const chave = req.headers?.['x-device-key']
  if (!chave) return null
  const { data } = await supabaseAdmin()
    .from('dispositivos')
    .select('*')
    .eq('api_key_hash', hashChave(chave))
    .maybeSingle()
  return data
}
