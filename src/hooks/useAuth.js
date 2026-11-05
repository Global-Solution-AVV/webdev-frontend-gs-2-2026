import { useContext } from 'react'
import { AuthContexto } from '../context/authContexto'

/** Sessão, perfil e ações de login/cadastro/sair. */
export function useAuth() {
  const contexto = useContext(AuthContexto)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
