import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useFormulario } from '../hooks/useFormulario'
import { Campo } from '../components/Campo'
import { Alerta } from '../components/Alerta'
import { botao, cartao } from '../lib/estilos'

const CONTAS_DEMO = [
  {
    perfil: 'Tutor',
    emails: [
      'ana.tutora@devolta.demo',
      'bruno.tutor@devolta.demo',
      'carla.tutora@devolta.demo',
      'diego.tutor@devolta.demo',
      'elisa.tutora@devolta.demo',
    ],
  },
  {
    perfil: 'ONG',
    emails: [
      'patas@devolta.demo',
      'abrigo@devolta.demo',
      'resgate.sul@devolta.demo',
      'miados@devolta.demo',
      'lar.leste@devolta.demo',
    ],
  },
  { perfil: 'Coordenação', emails: ['coordenacao@devolta.demo'] },
]

const INICIO_POR_PAPEL = { tutor: '/tutor', ong: '/ong', coordenacao: '/coordenacao' }

export function Entrar() {
  const { entrar, perfil, configurado } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  const form = useFormulario({ email: '', senha: '' }, async ({ email, senha }) => {
    await entrar(email.trim(), senha)
    // Sem página de origem, o redirecionamento abaixo leva à área do perfil quando ele carregar.
    if (local.state?.voltarPara) navegar(local.state.voltarPara, { replace: true })
  })

  // Já logado: vai direto para a área do perfil.
  if (perfil && !local.state?.voltarPara)
    return <Navigate to={INICIO_POR_PAPEL[perfil.papel]} replace />

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Entrar</h1>
      {!configurado && (
        <Alerta tipo="aviso">
          O login ainda não foi configurado (faltam as variáveis VITE_SUPABASE_*).
        </Alerta>
      )}
      <form onSubmit={form.enviar} className={`${cartao} space-y-4`}>
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={form.valores.email}
          onChange={form.alterar}
          required
        />
        <Campo
          rotulo="Senha"
          type="password"
          name="senha"
          autoComplete="current-password"
          value={form.valores.senha}
          onChange={form.alterar}
          required
        />
        <Alerta tipo="erro">{form.erro}</Alerta>
        <button
          type="submit"
          className={`${botao.primario} w-full`}
          disabled={form.enviando || !configurado}
        >
          {form.enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-stone-700">
          Ainda não tem conta?{' '}
          <Link to="/cadastrar" className="font-semibold text-marca-800 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
      <details className={`${cartao} text-sm text-stone-700`}>
        <summary className="cursor-pointer font-semibold">
          Contas de demonstração (dados fictícios)
        </summary>
        <p className="mt-2">
          Senha de todas: <code>devolta123</code>
        </p>
        <dl className="mt-3 space-y-3">
          {CONTAS_DEMO.map(({ perfil, emails }) => (
            <div key={perfil}>
              <dt className="font-semibold text-tinta">{perfil}</dt>
              <dd>
                <ul className="mt-1 space-y-0.5">
                  {emails.map((email) => (
                    <li key={email}>
                      <code className="break-all">{email}</code>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
