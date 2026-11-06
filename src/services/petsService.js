import { api } from './apiClient'

export const listarPets = () => api('pets')
export const buscarPet = (id) => api(`pets/${id}`)
export const criarPet = (dados) => api('pets', { metodo: 'POST', corpo: dados })
export const atualizarPet = (id, dados) => api(`pets/${id}`, { metodo: 'PUT', corpo: dados })
export const definirModoPerdido = (id, modo_perdido) =>
  api(`pets/${id}/modo-perdido`, { metodo: 'PATCH', corpo: { modo_perdido } })
export const definirCartaz = (id, cartaz_publico) =>
  api(`pets/${id}/cartaz`, { metodo: 'PATCH', corpo: { cartaz_publico } })
export const listarCartazes = ({ situacao = 'perdidos', especie = '' } = {}) =>
  api(`pets?cartazes=1&situacao=${situacao}${especie ? `&especie=${especie}` : ''}`)
export const excluirPet = (id) => api(`pets/${id}`, { metodo: 'DELETE' })
