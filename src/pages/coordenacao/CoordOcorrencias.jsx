import { useState } from 'react'
import { useOcorrencias } from '../../hooks/useOcorrencias'
import { CardOcorrencia } from '../../components/CardOcorrencia'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Campo } from '../../components/Campo'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { STATUS_OCORRENCIA } from '../../lib/formatos'
import { botao } from '../../lib/estilos'
import { RefreshCw } from 'lucide-react'

export function CoordOcorrencias() {
  const [status, setStatus] = useState('')
  const { ocorrencias, carregando, erro, recarregar, excluir } = useOcorrencias({ status })
  const [paraExcluir, setParaExcluir] = useState(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Todas as ocorrências</h1>
          <p className="text-stone-700">Visão geral dos pedidos de resgate em toda a rede.</p>
        </div>
        <div className="flex items-end gap-2">
          <Campo
            rotulo="Status"
            como="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-56"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_OCORRENCIA).map(([valor, info]) => (
              <option key={valor} value={valor}>
                {info.rotulo}
              </option>
            ))}
          </Campo>
          <button type="button" className={botao.secundario} onClick={recarregar}>
            <RefreshCw aria-hidden="true" size={18} />
            <span className="sr-only">Atualizar</span>
          </button>
        </div>
      </div>
      <Alerta tipo="erro">{erro}</Alerta>
      {carregando && !ocorrencias.length ? (
        <Carregando />
      ) : ocorrencias.length === 0 ? (
        <EstadoVazio titulo="Nenhuma ocorrência com esse filtro" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ocorrencias.map((o) => (
            <CardOcorrencia
              key={o.id}
              ocorrencia={o}
              link={`/coordenacao/ocorrencias/${o.id}`}
              acoes={
                <button
                  type="button"
                  className={`${botao.fantasma} text-rose-800`}
                  onClick={() => setParaExcluir(o)}
                >
                  Excluir
                </button>
              }
            />
          ))}
        </div>
      )}
      <ConfirmDialog
        aberto={Boolean(paraExcluir)}
        titulo="Excluir ocorrência?"
        mensagem="A ocorrência e o histórico serão apagados. Os avistamentos continuam no mapa."
        aoConfirmar={() => excluir(paraExcluir.id)}
        aoFechar={() => setParaExcluir(null)}
      />
    </div>
  )
}
