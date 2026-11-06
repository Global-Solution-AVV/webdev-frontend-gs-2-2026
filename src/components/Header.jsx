import { useState } from 'react'
import { LogOut, Menu, PawPrint, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { PAPEIS } from '../lib/formatos'
import { botao, botaoIcone } from '../lib/estilos'

const LINKS = {
  publico: [
    { para: '/mapa', texto: 'Mapa' },
    { para: '/cartazes', texto: 'Animais perdidos' },
  ],
  tutor: [
    { para: '/tutor', texto: 'Meus pets', fim: true },
    { para: '/tutor/perdidos', texto: 'Perdidos sem chip' },
  ],
  ong: [
    { para: '/ong', texto: 'Ocorrências', fim: true },
    { para: '/ong/cadastro', texto: 'Minha ONG' },
  ],
  coordenacao: [
    { para: '/coordenacao', texto: 'Pontos', fim: true },
    { para: '/coordenacao/simulador', texto: 'Simulador' },
    { para: '/coordenacao/ocorrencias', texto: 'Ocorrências' },
  ],
}

const classeLink = ({ isActive }) =>
  `block rounded-full px-4 py-2 font-medium transition ${isActive ? 'bg-marca-700 text-white' : 'text-tinta hover:bg-marca-100'}`

export function Header() {
  const { perfil, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const navegar = useNavigate()
  const links = [...LINKS.publico, ...(perfil ? LINKS[perfil.papel] : [])]

  async function aoSair() {
    await sair()
    setMenuAberto(false)
    navegar('/')
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-creme-escuro bg-creme/90 backdrop-blur">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-white focus:p-2"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-2xl font-semibold text-marca-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-700 text-white">
            <PawPrint aria-hidden="true" size={20} />
          </span>
          DeVolta
        </Link>

        <button
          type="button"
          className={`${botaoIcone} md:hidden`}
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          onClick={() => setMenuAberto((a) => !a)}
        >
          <span className="sr-only">{menuAberto ? 'Fechar menu' : 'Abrir menu'}</span>
          {menuAberto ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>

        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${menuAberto ? 'block' : 'hidden'} absolute left-0 right-0 top-full border-b border-creme-escuro bg-creme px-4 pb-4 md:static md:block md:border-0 md:bg-transparent md:p-0`}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:items-center">
            {links.map((l) => (
              <li key={l.para}>
                <NavLink
                  to={l.para}
                  end={l.fim}
                  className={classeLink}
                  onClick={() => setMenuAberto(false)}
                >
                  {l.texto}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 md:ml-3 md:mt-0">
              {perfil ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-600">
                    {perfil.nome} · {PAPEIS[perfil.papel]}
                  </span>
                  <button type="button" className={botao.secundario} onClick={aoSair}>
                    <LogOut aria-hidden="true" size={18} />
                    Sair
                  </button>
                </div>
              ) : (
                <Link to="/entrar" className={botao.primario} onClick={() => setMenuAberto(false)}>
                  Entrar
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
