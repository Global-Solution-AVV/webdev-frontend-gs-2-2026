// Cartazes públicos de pets com chip (aba /cartazes). Lógica pura, sem banco.

export const SITUACOES_CARTAZ = ['perdidos', 'encontrados']

/** Em qual aba o pet aparece, ou null se não deve aparecer em nenhuma. */
export function situacaoDoCartaz(pet) {
  if (!pet.cartaz_publico) return null
  if (pet.modo_perdido) return 'perdidos'
  if (pet.encontrado_em) return 'encontrados'
  return null
}

const primeiroNome = (nome) => (nome ?? '').trim().split(/\s+/)[0] || null

/**
 * Monta o cartaz com apenas os campos públicos. Nunca expõe chip, e-mail, sobrenome
 * ou ids do tutor. O telefone só aparece enquanto o animal está perdido (o tutor
 * autorizou para receber ajuda; depois de encontrado não há motivo para expor).
 */
export function montarCartaz(pet) {
  const situacao = situacaoDoCartaz(pet)
  if (!situacao) return null
  const perfil = pet.perfis ?? {}
  return {
    id: pet.id,
    nome: pet.nome,
    especie: pet.especie,
    foto_url: pet.foto_url,
    descricao: pet.cartaz_descricao,
    situacao,
    perdido_desde: pet.perdido_desde,
    encontrado_em: situacao === 'encontrados' ? pet.encontrado_em : null,
    tutor_nome: primeiroNome(perfil.nome),
    telefone: situacao === 'perdidos' ? (perfil.telefone ?? null) : null,
  }
}
