import { HttpErro } from './http.js'

// Validações simples reaproveitadas pelas funções. Lançam 422 com mensagem clara.

export function texto(valor, campo, { obrigatorio = true, max = 200 } = {}) {
  const v = typeof valor === 'string' ? valor.trim() : ''
  if (!v) {
    if (obrigatorio) throw new HttpErro(422, `Preencha o campo ${campo}`)
    return null
  }
  if (v.length > max) throw new HttpErro(422, `${campo} pode ter no máximo ${max} caracteres`)
  return v
}

export function numero(valor, campo, { min = -Infinity, max = Infinity, inteiro = false } = {}) {
  const n = Number(valor)
  if (valor === '' || valor === null || valor === undefined || !Number.isFinite(n)) {
    throw new HttpErro(422, `${campo} deve ser um número`)
  }
  if (inteiro && !Number.isInteger(n)) throw new HttpErro(422, `${campo} deve ser inteiro`)
  if (n < min || n > max) throw new HttpErro(422, `${campo} fora do intervalo permitido`)
  return n
}

export function opcao(valor, campo, opcoes) {
  if (!opcoes.includes(valor)) {
    throw new HttpErro(422, `${campo} deve ser: ${opcoes.join(', ')}`)
  }
  return valor
}

export function especie(valor) {
  return opcao(valor, 'espécie', ['gato', 'cachorro'])
}

export function coordenadas(obj) {
  return {
    lat: numero(obj.lat, 'latitude', { min: -90, max: 90 }),
    lng: numero(obj.lng, 'longitude', { min: -180, max: 180 }),
  }
}

export function url(valor, campo = 'URL da foto') {
  const v = texto(valor, campo, { obrigatorio: false, max: 500 })
  if (v === null) return null
  try {
    const u = new URL(v)
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error()
    return v
  } catch {
    throw new HttpErro(422, `${campo} deve ser um link http(s) válido`)
  }
}

export function chip(valor) {
  const v = String(valor ?? '').replace(/\s/g, '')
  if (!/^[0-9]{9,15}$/.test(v)) {
    throw new HttpErro(422, 'O número do microchip deve ter de 9 a 15 dígitos')
  }
  return v
}
