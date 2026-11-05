import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContexto } from './authContexto'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { buscarPerfil, completarPerfil } from '../services/perfilService'

/**
 * Mantém a sessão do Supabase Auth e o perfil (tutor, ONG ou coordenação) do usuário logado.
 */
export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(undefined) // undefined = ainda verificando
  const [perfilCarregado, setPerfilCarregado] = useState({ id: null, perfil: null, erro: null })
  const [versaoPerfil, setVersaoPerfil] = useState(0)

  // 1) Acompanha login/logout. O callback só atualiza estado (sem chamadas ao Supabase dentro dele).
  useEffect(() => {
    if (!supabase) return undefined
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const usuarioId = sessao?.user?.id ?? null

  // 2) Quando muda o usuário, busca o perfil na nossa API (cria se ainda não existir).
  useEffect(() => {
    if (!usuarioId) return undefined
    let ativo = true
    async function carregar() {
      try {
        let perfil
        try {
          perfil = await buscarPerfil()
        } catch (e) {
          if (e.status !== 403) throw e
          await completarPerfil()
          perfil = await buscarPerfil()
        }
        if (ativo) setPerfilCarregado({ id: usuarioId, perfil, erro: null })
      } catch (e) {
        if (ativo) setPerfilCarregado({ id: usuarioId, perfil: null, erro: e.message })
      }
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [usuarioId, versaoPerfil])

  const entrar = useCallback(async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(traduzirErroAuth(error.message))
  }, [])

  const cadastrar = useCallback(async ({ email, senha, nome, telefone, papel }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, telefone, papel } },
    })
    if (error) throw new Error(traduzirErroAuth(error.message))
    // Se o projeto exige confirmação de e-mail, não há sessão ainda.
    return { precisaConfirmar: !data.session }
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const recarregarPerfil = useCallback(() => setVersaoPerfil((v) => v + 1), [])

  const valor = useMemo(() => {
    const perfilValido = usuarioId && perfilCarregado.id === usuarioId
    return {
      configurado: supabaseConfigurado,
      usuario: sessao?.user ?? null,
      perfil: perfilValido ? perfilCarregado.perfil : null,
      erroPerfil: perfilValido ? perfilCarregado.erro : null,
      // Carregando enquanto a sessão não foi verificada ou o perfil do usuário atual não chegou.
      carregando:
        supabaseConfigurado && (sessao === undefined || (Boolean(usuarioId) && !perfilValido)),
      entrar,
      cadastrar,
      sair,
      recarregarPerfil,
    }
  }, [sessao, usuarioId, perfilCarregado, entrar, cadastrar, sair, recarregarPerfil])

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>
}

function traduzirErroAuth(mensagem) {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.'
  if (/already registered/i.test(mensagem)) return 'Este e-mail já tem cadastro. Tente entrar.'
  if (/password should be at least/i.test(mensagem))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/email not confirmed/i.test(mensagem)) return 'Confirme seu e-mail antes de entrar.'
  return mensagem
}
