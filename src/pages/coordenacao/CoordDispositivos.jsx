import { useState } from 'react'
import { useDispositivos } from '../../hooks/useDispositivos'
import { usePontosAoVivo } from '../../hooks/usePontosAoVivo'
import { FormDispositivo } from '../../components/FormDispositivo'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { BadgeStatus } from '../../components/BadgeStatus'
import { Mapa, LegendaMapa } from '../../components/Mapa'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { PainelAoVivo } from '../../components/PainelAoVivo'
import { LeituraSensor } from '../../components/LeituraSensor'
import { HistoricoLeituras } from '../../components/HistoricoLeituras'
import { dataHora } from '../../lib/formatos'
import { motivosDeAtencao } from '../../lib/telemetria'
import { botao, cartao } from '../../lib/estilos'

/** Gestão dos pontos de identificação e leitura do sensor de cada um (ao vivo ou a última gravada). */
export function CoordDispositivos() {
  const d = useDispositivos()
  const aoVivo = usePontosAoVivo()
  // Uma leitura por ponto, de uma fonte só: ao vivo se online, senão a última gravada.
  const linhas = d.dispositivos.map((x) => ({
    ...x,
    ...aoVivo.doPonto(x.codigo, x.ultima_leitura),
  }))
  const emAtencao = linhas
    .map((x) => ({ codigo: x.codigo, motivos: motivosDeAtencao(x.leitura) }))
    .filter((x) => x.motivos.length > 0)
  const [modal, setModal] = useState(null) // { tipo: 'novo'|'editar'|'historico'|'chave', dispositivo }
  const [paraExcluir, setParaExcluir] = useState(null)
  const [chaveGerada, setChaveGerada] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const fechar = () => {
    setModal(null)
    setChaveGerada(null)
    setErroAcao(null)
  }

  async function salvar(valores) {
    if (modal.tipo === 'novo') await d.criar(valores)
    else await d.atualizar(modal.dispositivo.id, valores)
    fechar()
  }

  async function executar(fn) {
    setEnviando(true)
    setErroAcao(null)
    try {
      await fn()
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Pontos de identificação</h1>
          <p className="text-stone-700">
            Dispositivos instalados nos parceiros e o nível de ração que o sensor de cada um mede.
          </p>
        </div>
        <button type="button" className={botao.primario} onClick={() => setModal({ tipo: 'novo' })}>
          + Novo ponto
        </button>
      </div>

      {emAtencao.length > 0 && (
        <Alerta tipo="aviso">
          <strong>Atenção:</strong>{' '}
          {emAtencao.map((x) => `${x.codigo} (${x.motivos.join(', ')})`).join('; ')}.
        </Alerta>
      )}
      <Alerta tipo="erro">{d.erro}</Alerta>

      <PainelAoVivo conexao={aoVivo.conexao} eventos={aoVivo.eventos} />

      <div className={cartao}>
        <Mapa
          altura="h-72"
          marcadores={d.dispositivos.map((x) => ({
            id: x.id,
            lat: x.lat,
            lng: x.lng,
            tipo: 'dispositivo',
            conteudo: `${x.codigo} · ${x.local_nome}`,
          }))}
          rotulo="Mapa dos pontos de identificação"
        />
        <div className="mt-2">
          <LegendaMapa tipos={['dispositivo']} />
        </div>
      </div>

      {d.carregando && !d.dispositivos.length ? (
        <Carregando />
      ) : d.dispositivos.length === 0 ? (
        <EstadoVazio titulo="Nenhum ponto cadastrado" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[52rem] text-left">
            <caption className="sr-only">Lista de pontos de identificação</caption>
            <thead className="bg-stone-100 text-sm uppercase text-stone-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Ponto
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Porções hoje
                </th>
                <th scope="col" className="px-4 py-3">
                  Leitura do sensor
                </th>
                <th scope="col" className="px-4 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {linhas.map((x) => {
                return (
                  <tr key={x.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{x.codigo}</p>
                      <p className="text-sm text-stone-600">{x.local_nome}</p>
                    </td>
                    <td className="px-4 py-3">
                      <BadgeStatus tipo="dispositivo" status={x.status} />
                      <p className="mt-1.5 text-sm text-stone-600">
                        {x.leitura
                          ? `Última medição: ${dataHora(x.leitura.medidoEm)}`
                          : 'Nenhuma medição ainda'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {x.porcoes_hoje} / {x.limite_porcoes_dia}
                    </td>
                    <td className="px-4 py-3">
                      <LeituraSensor situacao={x.situacao} leitura={x.leitura} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={botao.fantasma}
                          onClick={() => setModal({ tipo: 'historico', dispositivo: x })}
                        >
                          Histórico
                        </button>
                        <button
                          type="button"
                          className={botao.fantasma}
                          onClick={() => setModal({ tipo: 'editar', dispositivo: x })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={botao.fantasma}
                          onClick={() => setModal({ tipo: 'chave', dispositivo: x })}
                        >
                          Chave
                        </button>
                        <button
                          type="button"
                          className={`${botao.fantasma} text-rose-800`}
                          onClick={() => setParaExcluir(x)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        aberto={modal?.tipo === 'novo' || modal?.tipo === 'editar'}
        titulo={
          modal?.tipo === 'novo'
            ? 'Novo ponto de identificação'
            : `Editar ${modal?.dispositivo?.codigo}`
        }
        aoFechar={fechar}
      >
        <FormDispositivo
          key={modal?.dispositivo?.id ?? 'novo'}
          inicial={modal?.dispositivo}
          aoSalvar={salvar}
          aoCancelar={fechar}
        />
      </Modal>

      <Modal
        aberto={modal?.tipo === 'historico'}
        titulo={`Histórico de leituras · ${modal?.dispositivo?.codigo}`}
        aoFechar={fechar}
      >
        <HistoricoLeituras dispositivoId={modal?.dispositivo?.id} />
      </Modal>

      <Modal
        aberto={modal?.tipo === 'chave'}
        titulo={`Chave de API · ${modal?.dispositivo?.codigo}`}
        aoFechar={fechar}
      >
        <div className="space-y-4">
          <p className="text-stone-700">
            O ESP32 ou o script Python enviam detecções para <code>POST /api/deteccoes</code> com o
            cabeçalho <code>X-Device-Key</code>. Gerar uma chave nova invalida a anterior.
          </p>
          {chaveGerada ? (
            <Alerta tipo="sucesso">
              Copie agora, ela não será mostrada de novo:
              <code className="mt-2 block break-all rounded bg-white p-2 font-mono">
                {chaveGerada}
              </code>
            </Alerta>
          ) : (
            <p>
              {modal?.dispositivo?.tem_chave
                ? 'Este ponto já tem uma chave.'
                : 'Este ponto ainda não tem chave.'}
            </p>
          )}
          <Alerta tipo="erro">{erroAcao}</Alerta>
          {!chaveGerada && (
            <button
              type="button"
              className={botao.primario}
              disabled={enviando}
              onClick={() =>
                executar(async () => setChaveGerada(await d.gerarChave(modal.dispositivo.id)))
              }
            >
              Gerar nova chave
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        aberto={Boolean(paraExcluir)}
        titulo={`Excluir ${paraExcluir?.codigo ?? ''}?`}
        mensagem="Os avistamentos, detecções e ocorrências deste ponto também serão apagados."
        aoConfirmar={() => d.excluir(paraExcluir.id)}
        aoFechar={() => setParaExcluir(null)}
      />
    </div>
  )
}
