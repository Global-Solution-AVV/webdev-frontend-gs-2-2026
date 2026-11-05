import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Carregando } from './Carregando'
import { Alerta } from './Alerta'

/** Só mostra a página para quem está logado com o papel certo. */
export function RotaProtegida({ papel, children }) {
  const { usuario, perfil, carregando, erroPerfil } = useAuth()
  const local = useLocation()

  if (carregando) return <Carregando texto="Verificando seu acesso..." />
  if (!usuario) return <Navigate to="/entrar" replace state={{ voltarPara: local.pathname }} />
  if (erroPerfil)
    return <Alerta tipo="erro">Não foi possível carregar seu perfil: {erroPerfil}</Alerta>
  if (papel && perfil?.papel !== papel) {
    return (
      <Alerta tipo="aviso">
        Esta área é só para o perfil de{' '}
        {papel === 'coordenacao' ? 'coordenação' : papel === 'ong' ? 'ONG' : 'tutor'}.
      </Alerta>
    )
  }
  return children
}
