import { useState } from 'react'
import { Link } from 'react-router'
import { useAnimaisPerdidos } from '../../hooks/useAnimaisPerdidos'
import { CardAnimalPerdido } from '../../components/CardAnimalPerdido'
import { FormAnimalPerdido } from '../../components/FormAnimalPerdido'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { botao, cartao } from '../../lib/estilos'

export function TutorPerdidos() {
  const { perdidos, carregando, erro, criar, marcarEncontrado, excluir } = useAnimaisPerdidos()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [paraExcluir, setParaExcluir] = useState(null)
  const [mensagem, setMensagem] = useState(null)

  async function salvar(valores) {
    await criar(valores)
    setMostrarForm(false)
    setMensagem({
      tipo: 'sucesso',
      texto: 'Animal cadastrado. Abra o card para ver os avistamentos próximos.',
    })
  }

  async function encontrado(p) {
    try {
      await marcarEncontrado(p)
      setMensagem({ tipo: 'sucesso', texto: `Que bom que ${p.nome} voltou!` })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Animais perdidos</h1>
          <p className="text-stone-700">
            Para pets sem microchip: cadastre e compare com os avistamentos dos pontos de
            identificação.
          </p>
        </div>
        {!mostrarForm && (
          <button type="button" className={botao.primario} onClick={() => setMostrarForm(true)}>
            + Meu pet sumiu
          </button>
        )}
      </div>

      {mensagem && (
        <Alerta tipo={mensagem.tipo} aoFechar={() => setMensagem(null)}>
          {mensagem.texto}
        </Alerta>
      )}

      {mostrarForm && (
        <section className={cartao} aria-labelledby="titulo-novo-perdido">
          <h2 id="titulo-novo-perdido" className="mb-4 text-xl font-semibold">
            Cadastrar animal perdido
          </h2>
          <FormAnimalPerdido aoSalvar={salvar} aoCancelar={() => setMostrarForm(false)} />
        </section>
      )}

      <Alerta tipo="erro">{erro}</Alerta>
      {carregando && !perdidos.length ? (
        <Carregando />
      ) : perdidos.length === 0 ? (
        !mostrarForm && (
          <EstadoVazio titulo="Nenhum animal perdido cadastrado">
            Esperamos que continue assim!
          </EstadoVazio>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perdidos.map((p) => (
            <CardAnimalPerdido
              key={p.id}
              perdido={p}
              link={`/tutor/perdidos/${p.id}`}
              acoes={
                <>
                  <Link to={`/tutor/perdidos/${p.id}`} className={`${botao.primario} flex-1`}>
                    Ver avistamentos
                  </Link>
                  {p.status === 'ativo' && (
                    <button
                      type="button"
                      className={botao.secundario}
                      onClick={() => encontrado(p)}
                    >
                      Encontrei!
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${botao.fantasma} text-rose-800`}
                    onClick={() => setParaExcluir(p)}
                  >
                    Excluir
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        aberto={Boolean(paraExcluir)}
        titulo="Excluir cadastro?"
        mensagem={`O cadastro de ${paraExcluir?.nome ?? ''} sai do mapa público.`}
        aoConfirmar={() => excluir(paraExcluir.id)}
        aoFechar={() => setParaExcluir(null)}
      />
    </div>
  )
}
