import { useId } from 'react'
import { campo as classeCampo } from '../lib/estilos'

/**
 * Campo de formulário com label sempre visível e dica opcional.
 * `como`: 'input' (padrão), 'select' ou 'textarea'.
 */
export function Campo({ rotulo, dica, como = 'input', children, className = '', ...props }) {
  const id = useId()
  const idDica = dica ? `${id}-dica` : undefined
  const comum = { id, 'aria-describedby': idDica, className: classeCampo, ...props }
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-medium text-stone-800">
        {rotulo}
        {props.required && <span className="text-rose-700"> *</span>}
      </label>
      {como === 'select' && <select {...comum}>{children}</select>}
      {como === 'textarea' && <textarea rows={3} {...comum} />}
      {como === 'input' && <input {...comum} />}
      {dica && (
        <p id={idDica} className="mt-1 text-sm text-stone-600">
          {dica}
        </p>
      )}
    </div>
  )
}
