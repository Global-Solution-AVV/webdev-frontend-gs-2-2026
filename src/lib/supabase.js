import { createClient } from '@supabase/supabase-js'

// No navegador o Supabase é usado SÓ para login/sessão (Supabase Auth).
// Os dados passam pela nossa API (/api), nunca direto pelo banco.
const url = import.meta.env.VITE_SUPABASE_URL
const chaveAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && chaveAnon)

export const supabase = supabaseConfigurado ? createClient(url, chaveAnon) : null
