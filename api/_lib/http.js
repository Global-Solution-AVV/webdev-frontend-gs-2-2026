/** Erro com status HTTP, lançado pelas funções e convertido em JSON { erro }. */
export class HttpErro extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
  }
}

export const naoEncontrado = (o = 'Registro') => new HttpErro(404, `${o} não encontrado`)

/**
 * Monta o handler de uma função a partir de um mapa "MÉTODO" ou "MÉTODO acao".
 * Ex.: { GET: listar, 'POST assumir': assumir }
 * O `id` e a `acao` chegam por query, preenchidos pelos rewrites do vercel.json.
 */
export function rotas(mapa) {
  return async function handler(req, res) {
    const acao = req.query?.acao
    const chave = acao ? `${req.method} ${acao}` : req.method
    const fn = mapa[chave]
    if (!fn) {
      return res.status(405).json({ erro: `Método ${chave} não suportado` })
    }
    try {
      const resultado = await fn(req, res)
      if (!res.headersSent) {
        if (resultado === undefined) return res.status(204).end()
        return res.status(req.method === 'POST' && !acao ? 201 : 200).json(resultado)
      }
    } catch (e) {
      const status = e instanceof HttpErro ? e.status : 500
      if (status === 500) console.error(e)
      const mensagem = status === 500 ? 'Erro interno no servidor' : e.message
      return res.status(status).json({ erro: mensagem })
    }
  }
}

/** Lê o corpo JSON (a Vercel já faz o parse quando o Content-Type é application/json). */
export function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body) {
    try {
      return JSON.parse(req.body)
    } catch {
      throw new HttpErro(400, 'JSON inválido')
    }
  }
  return {}
}

export function exigirId(req) {
  const id = req.query?.id
  if (!id) throw new HttpErro(400, 'Informe o id na URL')
  return id
}

/** Converte erro do supabase-js em HttpErro legível. */
export function checar({ data, error }, contexto = 'Operação') {
  if (error) {
    if (error.code === '23505') throw new HttpErro(409, `${contexto}: registro duplicado`)
    if (error.code === '23514' || error.code === '22P02') {
      throw new HttpErro(422, `${contexto}: dados inválidos`)
    }
    if (error.code === 'PGRST116') throw naoEncontrado(contexto)
    throw new Error(`${contexto}: ${error.message}`)
  }
  return data
}
