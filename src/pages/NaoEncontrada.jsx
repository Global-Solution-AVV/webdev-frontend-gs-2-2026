import { Link } from 'react-router'
import { EstadoVazio } from '../components/EstadoVazio'
import { botao } from '../lib/estilos'
import { Compass } from 'lucide-react'

export function NaoEncontrada() {
  return (
    <EstadoVazio titulo="Página não encontrada" icone={Compass}>
      Parece que esse caminho não existe.
      <div className="mt-4">
        <Link to="/" className={botao.primario}>
          Voltar ao início
        </Link>
      </div>
    </EstadoVazio>
  )
}
