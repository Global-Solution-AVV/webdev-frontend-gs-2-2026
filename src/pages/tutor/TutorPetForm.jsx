import { Link, useNavigate, useParams } from 'react-router'
import { useRequisicao } from '../../hooks/useRequisicao'
import { buscarPet, criarPet, atualizarPet } from '../../services/petsService'
import { FormPet } from '../../components/FormPet'
import { Carregando } from '../../components/Carregando'
import { Alerta } from '../../components/Alerta'
import { cartao } from '../../lib/estilos'
import { LinkVoltar } from '../../components/LinkVoltar'

/** Cadastro (/tutor/pets/novo) e edição (/tutor/pets/:id) de pet. */
export function TutorPetForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navegar = useNavigate()
  const {
    dados: pet,
    carregando,
    erro,
  } = useRequisicao(() => (editando ? buscarPet(id) : Promise.resolve(null)), [id])

  async function salvar(valores) {
    if (editando) await atualizarPet(id, valores)
    else await criarPet(valores)
    navegar('/tutor')
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <LinkVoltar para="/tutor" />
      <h1 className="text-3xl font-semibold">{editando ? 'Editar pet' : 'Cadastrar pet'}</h1>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Alerta tipo="erro">{erro}</Alerta>
      ) : (
        <div className={cartao}>
          <FormPet
            inicial={pet ?? undefined}
            aoSalvar={salvar}
            aoCancelar={() => navegar('/tutor')}
          />
        </div>
      )}
    </div>
  )
}
