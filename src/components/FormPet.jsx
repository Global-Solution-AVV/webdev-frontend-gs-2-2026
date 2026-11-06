import { useFormulario } from '../hooks/useFormulario'
import { Campo } from './Campo'
import { Alerta } from './Alerta'
import { botao } from '../lib/estilos'

const VAZIO = { nome: '', especie: '', chip: '', foto_url: '', cartaz_descricao: '' }

export function FormPet({ inicial, aoSalvar, aoCancelar }) {
  const { valores, alterar, enviar, enviando, erro } = useFormulario(
    { ...VAZIO, ...inicial },
    aoSalvar,
  )
  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        rotulo="Nome do pet"
        name="nome"
        value={valores.nome}
        onChange={alterar}
        required
        maxLength={80}
      />
      <Campo
        rotulo="Espécie"
        como="select"
        name="especie"
        value={valores.especie}
        onChange={alterar}
        required
      >
        <option value="">Escolha...</option>
        <option value="gato">Gato</option>
        <option value="cachorro">Cachorro</option>
      </Campo>
      <Campo
        rotulo="Número do microchip"
        name="chip"
        value={valores.chip}
        onChange={alterar}
        required
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={15}
        dica="Só números, de 9 a 15 dígitos. Está na carteirinha de vacinação ou no cadastro do SinPatinhas."
      />
      <Campo
        rotulo="Link da foto (opcional)"
        name="foto_url"
        type="url"
        value={valores.foto_url ?? ''}
        onChange={alterar}
        placeholder="https://..."
        dica="Cole o link de uma foto do seu pet."
      />
      <Campo
        rotulo="Texto do cartaz (opcional)"
        como="textarea"
        name="cartaz_descricao"
        value={valores.cartaz_descricao ?? ''}
        onChange={alterar}
        maxLength={500}
        dica="Aparece no cartaz público se o pet se perder e você autorizar. Ex.: cor da coleira, onde sumiu, se é medroso."
      />
      <Alerta tipo="erro">{erro}</Alerta>
      <div className="flex gap-3">
        <button type="submit" className={botao.primario} disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar pet'}
        </button>
        {aoCancelar && (
          <button type="button" className={botao.secundario} onClick={aoCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
