import { useFormulario } from '../hooks/useFormulario'
import { Campo } from './Campo'
import { Alerta } from './Alerta'
import { SeletorLocal } from './SeletorLocal'
import { botao } from '../lib/estilos'

export function FormOng({ inicial, aoSalvar }) {
  const { valores, alterar, definir, enviar, enviando, erro } = useFormulario(
    { nome: '', contato_publico: '', lat: '', lng: '', raio_km: '5', vagas: '0', ...inicial },
    aoSalvar,
  )
  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        rotulo="Nome da ONG"
        name="nome"
        value={valores.nome}
        onChange={alterar}
        required
        maxLength={120}
      />
      <Campo
        rotulo="Contato público"
        name="contato_publico"
        value={valores.contato_publico ?? ''}
        onChange={alterar}
        maxLength={120}
        dica="Aparece para o público. Use um contato institucional, nunca um telefone pessoal."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Raio de atuação (km)"
          type="number"
          name="raio_km"
          min="0.1"
          step="0.1"
          value={valores.raio_km}
          onChange={alterar}
          required
          dica="Você só recebe ocorrências dentro desse raio."
        />
        <Campo
          rotulo="Vagas disponíveis"
          type="number"
          name="vagas"
          min="0"
          step="1"
          value={valores.vagas}
          onChange={alterar}
          required
          dica="Com 0 vagas, você não recebe novas ocorrências."
        />
      </div>
      <SeletorLocal
        rotulo="Sede ou centro da área de atuação"
        valor={{ lat: valores.lat, lng: valores.lng }}
        aoMudar={definir}
        raioKm={valores.raio_km}
      />
      <Alerta tipo="erro">{erro}</Alerta>
      <button type="submit" className={botao.primario} disabled={enviando}>
        {enviando ? 'Salvando...' : 'Salvar dados da ONG'}
      </button>
    </form>
  )
}
