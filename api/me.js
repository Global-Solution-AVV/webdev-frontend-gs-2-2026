// /api/me — perfil do usuário logado.
import { rotas, corpo, checar, HttpErro } from './_lib/http.js'
import { exigirUsuario, usuarioOpcional } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { texto } from './_lib/validacao.js'

export default rotas({
  async GET(req) {
    const { usuario, perfil } = await exigirUsuario(req)
    return { ...perfil, email: usuario.email }
  },

  // Completa o perfil se o gatilho do banco não o criou (ex.: banco criado depois do usuário).
  async POST(req) {
    const sessao = await usuarioOpcional(req)
    if (!sessao) throw new HttpErro(401, 'Faça login para continuar')
    if (sessao.perfil) return sessao.perfil
    const meta = sessao.usuario.user_metadata ?? {}
    const papel = ['tutor', 'ong'].includes(meta.papel) ? meta.papel : 'tutor'
    return checar(
      await supabaseAdmin()
        .from('perfis')
        .insert({
          id: sessao.usuario.id,
          papel,
          nome: meta.nome || sessao.usuario.email.split('@')[0],
          telefone: meta.telefone ?? null,
        })
        .select()
        .single(),
      'Perfil',
    )
  },

  async PUT(req) {
    const { perfil } = await exigirUsuario(req)
    const dados = corpo(req)
    return checar(
      await supabaseAdmin()
        .from('perfis')
        .update({
          nome: texto(dados.nome, 'nome', { max: 120 }),
          telefone: texto(dados.telefone, 'telefone', { obrigatorio: false, max: 20 }),
        })
        .eq('id', perfil.id)
        .select()
        .single(),
      'Perfil',
    )
  },

  // Exclui a conta (o perfil e os dados ligados caem em cascata).
  async DELETE(req) {
    const { usuario, perfil } = await exigirUsuario(req)
    if (perfil.papel === 'coordenacao') {
      throw new HttpErro(403, 'A conta da coordenação não pode ser excluída por aqui')
    }
    const { error } = await supabaseAdmin().auth.admin.deleteUser(usuario.id)
    if (error) throw new Error(error.message)
  },
})
