import { useState } from 'react'
import { Link } from 'react-router'
import { usePets } from '../../hooks/usePets'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { CardPet } from '../../components/CardPet'
import { ListaNotificacoes } from '../../components/ListaNotificacoes'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Carregando } from '../../components/Carregando'
import { EstadoVazio } from '../../components/EstadoVazio'
import { Alerta } from '../../components/Alerta'
import { botao } from '../../lib/estilos'
import { RefreshCw } from 'lucide-react'

export function TutorPainel() {
  const pets = usePets()
  const notif = useNotificacoes()
  const [paraExcluir, setParaExcluir] = useState(null)
  const [alternandoId, setAlternandoId] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)

  async function alternar(pet, fn = pets.alternarModoPerdido) {
    setAlternandoId(pet.id)
    setErroAcao(null)
    try {
      await fn(pet)
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setAlternandoId(null)
    }
  }

  async function responder(id, resposta) {
    setErroAcao(null)
    try {
      await notif.responder(id, resposta)
      // "Ele está perdido" liga o modo perdido do pet: atualiza os cards.
      if (resposta === 'perdido') pets.recarregar()
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  async function acao(fn) {
    setErroAcao(null)
    try {
      await fn()
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  return (
    <div className="space-y-10">
      <Alerta tipo="erro" aoFechar={() => setErroAcao(null)}>
        {erroAcao}
      </Alerta>

      <section aria-labelledby="titulo-avisos" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 id="titulo-avisos" className="text-2xl font-semibold">
            Avisos{' '}
            {notif.naoLidas > 0 && (
              <span className="ml-1 rounded-full bg-marca-700 px-2 py-0.5 text-base text-white">
                {notif.naoLidas}
              </span>
            )}
          </h1>
          <button type="button" className={botao.fantasma} onClick={notif.recarregar}>
            <RefreshCw aria-hidden="true" size={18} />
            Atualizar
          </button>
        </div>
        <Alerta tipo="erro">{notif.erro}</Alerta>
        {notif.carregando && !notif.notificacoes.length ? (
          <Carregando />
        ) : (
          <ListaNotificacoes
            notificacoes={notif.notificacoes}
            aoResponder={responder}
            aoMarcarLida={(id) => acao(() => notif.marcarLida(id))}
            aoExcluir={(id) => acao(() => notif.excluir(id))}
          />
        )}
      </section>

      <section aria-labelledby="titulo-pets" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="titulo-pets" className="text-2xl font-semibold">
            Meus pets com microchip
          </h2>
          <Link to="/tutor/pets/novo" className={botao.primario}>
            + Cadastrar pet
          </Link>
        </div>
        <Alerta tipo="erro">{pets.erro}</Alerta>
        {pets.carregando && !pets.pets.length ? (
          <Carregando />
        ) : pets.pets.length === 0 ? (
          <EstadoVazio titulo="Você ainda não cadastrou nenhum pet">
            Cadastre o número do microchip para ser avisado quando ele passar por um ponto de
            identificação.
            <br />
            Seu pet não tem chip e sumiu?{' '}
            <Link to="/tutor/perdidos" className="font-semibold text-marca-800 underline">
              Cadastre um animal perdido
            </Link>
            .
          </EstadoVazio>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.pets.map((p) => (
              <CardPet
                key={p.id}
                pet={p}
                alternando={alternandoId === p.id}
                aoAlternarModoPerdido={alternar}
                aoAlternarCartaz={(pet) => alternar(pet, pets.alternarCartaz)}
                aoExcluir={setParaExcluir}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        aberto={Boolean(paraExcluir)}
        titulo="Excluir pet?"
        mensagem={`${paraExcluir?.nome ?? ''} e os avisos ligados a ele serão apagados. Essa ação não pode ser desfeita.`}
        aoConfirmar={() => pets.excluir(paraExcluir.id)}
        aoFechar={() => setParaExcluir(null)}
      />
    </div>
  )
}
