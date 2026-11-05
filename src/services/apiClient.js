import { supabase } from '../lib/supabase'

/** Erro vindo da API, com o status HTTP. */
export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
  }
}

async function tokenAtual() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Chamada à nossa API (/api). Envia o token do Supabase Auth quando há sessão
 * e converte as respostas de erro { erro } em ErroApi.
 */
export async function api(caminho, { metodo = 'GET', corpo, query } = {}) {
  const url = new URL(`/api/${caminho}`, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }
  const cabecalhos = { Accept: 'application/json' }
  const token = await tokenAtual()
  if (token) cabecalhos.Authorization = `Bearer ${token}`
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'

  let resposta
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Verifique sua internet e tente de novo.')
  }

  if (resposta.status === 204) return null
  const texto = await resposta.text()
  const ehJson = resposta.headers.get('content-type')?.includes('application/json')
  if (resposta.ok && texto && !ehJson) {
    // Ex.: `npm run dev` sem a API: o Vite devolve o index.html no lugar do JSON.
    throw new ErroApi(
      502,
      'A API não respondeu. Rode o projeto com `npm run dev:full` (vercel dev).',
    )
  }
  const dados = lerJson(texto)
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      dados?.erro ?? `Erro ${resposta.status} ao falar com o servidor`,
    )
  }
  return dados
}

function lerJson(texto) {
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}
