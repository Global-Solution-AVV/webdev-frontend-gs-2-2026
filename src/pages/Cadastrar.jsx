import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useFormulario } from '../hooks/useFormulario'
import { Campo } from '../components/Campo'
import { Alerta } from '../components/Alerta'
import { botao, cartao } from '../lib/estilos'

export function Cadastrar() {
  const { cadastrar, configurado } = useAuth()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const [confirmar, setConfirmar] = useState(false)

  const form = useFormulario(
    {
      papel: parametros.get('papel') === 'ong' ? 'ong' : 'tutor',
      nome: '',
      email: '',
      senha: '',
      telefone: '',
    },
    async (v) => {
      if (v.senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
      if (!v.nome.trim()) throw new Error('Preencha seu nome.')
      const { precisaConfirmar } = await cadastrar({
        email: v.email.trim(),
        senha: v.senha,
        nome: v.nome.trim(),
        telefone: v.papel === 'tutor' ? v.telefone.trim() : null,
        papel: v.papel,
      })
      if (precisaConfirmar) setConfirmar(true)
      else navegar(v.papel === 'ong' ? '/ong/cadastro' : '/tutor', { replace: true })
    },
  )
  const { valores, alterar } = form

  if (confirmar) {
    return (
      <div className="mx-auto max-w-md">
        <Alerta tipo="sucesso">
          Quase lá! Enviamos um link para <strong>{valores.email}</strong>. Confirme o e-mail e
          depois{' '}
          <Link to="/entrar" className="underline">
            entre
          </Link>
          .
        </Alerta>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Criar conta</h1>
      <form onSubmit={form.enviar} className={`${cartao} space-y-4`}>
        <fieldset>
          <legend className="mb-2 font-medium text-stone-800">Eu sou</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { valor: 'tutor', texto: 'Tutor de pet' },
              { valor: 'ong', texto: 'ONG de resgate' },
            ].map((o) => (
              <label
                key={o.valor}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center font-semibold ${valores.papel === o.valor ? 'border-marca-700 bg-marca-50 text-marca-900' : 'border-stone-300'}`}
              >
                <input
                  type="radio"
                  name="papel"
                  value={o.valor}
                  checked={valores.papel === o.valor}
                  onChange={alterar}
                  className="sr-only"
                />
                {o.texto}
              </label>
            ))}
          </div>
        </fieldset>
        <Campo
          rotulo={valores.papel === 'ong' ? 'Nome do responsável' : 'Seu nome'}
          name="nome"
          value={valores.nome}
          onChange={alterar}
          required
          autoComplete="name"
        />
        <Campo
          rotulo="E-mail"
          type="email"
          name="email"
          value={valores.email}
          onChange={alterar}
          required
          autoComplete="email"
        />
        <Campo
          rotulo="Senha"
          type="password"
          name="senha"
          value={valores.senha}
          onChange={alterar}
          required
          minLength={6}
          autoComplete="new-password"
          dica="Pelo menos 6 caracteres."
        />
        {valores.papel === 'tutor' && (
          <Campo
            rotulo="Celular para avisos"
            type="tel"
            name="telefone"
            value={valores.telefone}
            onChange={alterar}
            autoComplete="tel"
            placeholder="(11) 90000-0000"
            dica="O sistema usa este número para avisar você. Ele só fica público se você publicar um cartaz de pet perdido."
          />
        )}
        <Alerta tipo="erro">{form.erro}</Alerta>
        <button
          type="submit"
          className={`${botao.primario} w-full`}
          disabled={form.enviando || !configurado}
        >
          {form.enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
        <p className="text-center text-stone-700">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-semibold text-marca-800 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
