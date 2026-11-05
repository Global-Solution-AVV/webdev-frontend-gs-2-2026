import { useFormulario } from '../hooks/useFormulario'
import { Campo } from './Campo'
import { Alerta } from './Alerta'
import { SeletorLocal } from './SeletorLocal'
import { botao } from '../lib/estilos'
import { hojeISO } from '../lib/formatos'

export function FormAnimalPerdido({ inicial, aoSalvar, aoCancelar }) {
  const { valores, alterar, definir, enviar, enviando, erro } = useFormulario(
    {
      nome: '',
      especie: '',
      descricao: '',
      foto_url: '',
      lat: '',
      lng: '',
      perdido_em: hojeISO(),
      ...inicial,
    },
    aoSalvar,
  )
  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        rotulo="Nome do animal"
        name="nome"
        value={valores.nome}
        onChange={alterar}
        required
        maxLength={80}
      />
      <div className="grid gap-4 sm:grid-cols-2">
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
          rotulo="Quando sumiu"
          type="date"
          name="perdido_em"
          value={valores.perdido_em}
          max={hojeISO()}
          onChange={alterar}
          required
        />
      </div>
      <Campo
        rotulo="Como ele é"
        como="textarea"
        name="descricao"
        value={valores.descricao ?? ''}
        onChange={alterar}
        maxLength={500}
        dica="Cor, porte, coleira, alguma marca. Isso ajuda a comparar com os avistamentos."
      />
      <Campo
        rotulo="Link da foto"
        type="url"
        name="foto_url"
        value={valores.foto_url ?? ''}
        onChange={alterar}
        placeholder="https://..."
      />
      <SeletorLocal
        rotulo="Onde ele foi visto pela última vez"
        valor={{ lat: valores.lat, lng: valores.lng }}
        aoMudar={definir}
      />
      <Alerta tipo="erro">{erro}</Alerta>
      <div className="flex gap-3">
        <button type="submit" className={botao.primario} disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar'}
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
