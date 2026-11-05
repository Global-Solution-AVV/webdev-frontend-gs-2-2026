// Classes Tailwind reaproveitadas (botões, campos e cartões), para manter a interface consistente.
const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

export const botao = {
  primario: `${base} bg-marca-700 text-white shadow-sm hover:bg-marca-800`,
  secundario: `${base} border border-marca-200 bg-white text-marca-900 hover:border-marca-300 hover:bg-marca-50`,
  perigo: `${base} bg-rose-700 text-white hover:bg-rose-800`,
  fantasma: `${base} text-marca-800 hover:bg-marca-100`,
}

/** Botão só com ícone (precisa de aria-label ou texto sr-only). */
export const botaoIcone =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-marca-900 transition hover:bg-marca-100'

export const campo =
  'w-full rounded-2xl border border-creme-escuro bg-white px-4 py-2.5 text-base text-tinta placeholder:text-stone-500 focus:border-marca-500'

export const cartao = 'rounded-cartao border border-creme-escuro bg-white p-5 shadow-sm'

/** Selo pequeno acima de títulos (ex.: "CitizenTech · São Paulo"). */
export const selo =
  'inline-flex items-center gap-2 rounded-full bg-marca-100 px-3 py-1 text-sm font-semibold text-marca-800'
