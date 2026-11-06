import { useCallback } from 'react'
import { useRequisicao } from './useRequisicao'
import {
  listarPets,
  criarPet,
  atualizarPet,
  definirModoPerdido,
  definirCartaz,
  excluirPet,
} from '../services/petsService'

/** CRUD dos pets do tutor e o interruptor de modo perdido. */
export function usePets() {
  const { dados, erro, carregando, recarregar, setDados } = useRequisicao(listarPets, [])

  const trocar = useCallback(
    (pet) => setDados((lista) => (lista ?? []).map((p) => (p.id === pet.id ? pet : p))),
    [setDados],
  )

  const criar = useCallback(
    async (valores) => {
      const pet = await criarPet(valores)
      setDados((lista) => [pet, ...(lista ?? [])])
      return pet
    },
    [setDados],
  )

  const atualizar = useCallback(
    async (id, valores) => {
      const pet = await atualizarPet(id, valores)
      trocar(pet)
      return pet
    },
    [trocar],
  )

  const alternarModoPerdido = useCallback(
    async (pet) => {
      const atualizado = await definirModoPerdido(pet.id, !pet.modo_perdido)
      trocar(atualizado)
      return atualizado
    },
    [trocar],
  )

  const alternarCartaz = useCallback(
    async (pet) => {
      const atualizado = await definirCartaz(pet.id, !pet.cartaz_publico)
      trocar(atualizado)
      return atualizado
    },
    [trocar],
  )

  const excluir = useCallback(
    async (id) => {
      await excluirPet(id)
      setDados((lista) => (lista ?? []).filter((p) => p.id !== id))
    },
    [setDados],
  )

  return {
    pets: dados ?? [],
    carregando,
    erro,
    recarregar,
    criar,
    atualizar,
    alternarModoPerdido,
    alternarCartaz,
    excluir,
  }
}
