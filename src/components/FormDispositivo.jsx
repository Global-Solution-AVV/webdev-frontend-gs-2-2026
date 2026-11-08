import { useFormulario } from '../hooks/useFormulario'
import { Campo } from './Campo'
import { Alerta } from './Alerta'
import { SeletorLocal } from './SeletorLocal'
import { botao } from '../lib/estilos'

const PADRAO = {
  codigo: '',
  local_nome: '',
  lat: '',
  lng: '',
  limite_porcoes_dia: '10',
  status: 'ativo',
}

export function FormDispositivo({ inicial, aoSalvar, aoCancelar }) {
  const { valores, alterar, definir, enviar, enviando, erro } = useFormulario(
    { ...PADRAO, ...inicial },
    aoSalvar,
  )
  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Código"
          name="codigo"
          value={valores.codigo}
          onChange={alterar}
          required
          maxLength={30}
          placeholder="DV-005"
        />
        <Campo
          rotulo="Status"
          como="select"
          name="status"
          value={valores.status}
          onChange={alterar}
          required
        >
          <option value="ativo">Ativo</option>
          <option value="manutencao">Em manutenção</option>
          <option value="inativo">Inativo</option>
        </Campo>
      </div>
      <Campo
        rotulo="Nome do local"
        name="local_nome"
        value={valores.local_nome}
        onChange={alterar}
        required
        maxLength={120}
        dica="Ex.: Clínica veterinária parceira · Rua tal"
      />
      <Campo
        rotulo="Limite de porções por dia"
        type="number"
        min="0"
        name="limite_porcoes_dia"
        value={valores.limite_porcoes_dia}
        onChange={alterar}
        required
        dica="O nível de ração não é digitado aqui: ele vem do sensor do próprio ponto."
      />
      <SeletorLocal
        rotulo="Localização do ponto"
        valor={{ lat: valores.lat, lng: valores.lng }}
        aoMudar={definir}
      />
      <Alerta tipo="erro">{erro}</Alerta>
      <div className="flex gap-3">
        <button type="submit" className={botao.primario} disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar ponto'}
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
