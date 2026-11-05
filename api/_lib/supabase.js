import { createClient } from '@supabase/supabase-js'

let cliente = null

/**
 * Cliente do Supabase com a service role key (somente no servidor).
 * Ignora o RLS, por isso TODA checagem de permissão é feita nas funções /api.
 */
export function supabaseAdmin() {
  if (cliente) return cliente
  const url = process.env.SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas')
  }
  cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  return cliente
}
