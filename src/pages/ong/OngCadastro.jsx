import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMinhaOng } from '../../hooks/useOngs'
import { FormOng } from '../../components/FormOng'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Carregando } from '../../components/Carregando'
import { Alerta } from '../../components/Alerta'
import { botao, cartao } from '../../lib/estilos'

export function OngCadastro() {
  const { ong, carregando, erro, salvar, excluir } = useMinhaOng()
  const [mensagem, setMensagem] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const navegar = useNavigate()

  async function aoSalvar(valores) {
    const nova = !ong
    await salvar(valores)
    if (nova) navegar('/ong')
    else setMensagem('Dados da ONG atualizados.')
  }

  if (carregando) return <Carregando />
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">{ong ? 'Dados da ONG' : 'Cadastrar ONG'}</h1>
      <p className="text-stone-700">
        Vocês só recebem ocorrências dentro da área de atuação e enquanto tiverem vagas.
      </p>
      <Alerta tipo="erro">{erro}</Alerta>
      {mensagem && (
        <Alerta tipo="sucesso" aoFechar={() => setMensagem(null)}>
          {mensagem}
        </Alerta>
      )}
      <div className={cartao}>
        {/* key: remonta o formulário com os dados certos depois de carregar */}
        <FormOng key={ong?.id ?? 'nova'} inicial={ong ?? undefined} aoSalvar={aoSalvar} />
      </div>
      {ong && (
        <button
          type="button"
          className={botao.fantasma + ' text-rose-800'}
          onClick={() => setExcluindo(true)}
        >
          Excluir cadastro da ONG
        </button>
      )}
      <ConfirmDialog
        aberto={excluindo}
        titulo="Excluir cadastro da ONG?"
        mensagem="As ocorrências em atendimento por vocês ficam sem ONG responsável."
        aoConfirmar={excluir}
        aoFechar={() => setExcluindo(false)}
      />
    </div>
  )
}
