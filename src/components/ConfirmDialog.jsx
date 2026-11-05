import { useState } from 'react'
import { Modal } from './Modal'
import { Alerta } from './Alerta'
import { botao } from '../lib/estilos'

/** Pede confirmação antes de uma ação (ex.: excluir). */
export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Excluir',
  perigo = true,
  aoConfirmar,
  aoFechar,
}) {
  const [executando, setExecutando] = useState(false)
  const [erro, setErro] = useState(null)

  async function confirmar() {
    setExecutando(true)
    setErro(null)
    try {
      await aoConfirmar()
      aoFechar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setExecutando(false)
    }
  }

  function fechar() {
    setErro(null)
    aoFechar()
  }

  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={fechar}>
      <p className="text-stone-700">{mensagem}</p>
      {erro && (
        <div className="mt-3">
          <Alerta tipo="erro">{erro}</Alerta>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className={botao.secundario} onClick={fechar}>
          Cancelar
        </button>
        <button
          type="button"
          className={perigo ? botao.perigo : botao.primario}
          onClick={confirmar}
          disabled={executando}
        >
          {executando ? 'Aguarde...' : textoConfirmar}
        </button>
      </div>
    </Modal>
  )
}
