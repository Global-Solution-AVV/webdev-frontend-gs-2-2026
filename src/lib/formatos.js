// Textos e formatações exibidos na interface.
import {
  CircleAlert,
  CircleCheck,
  CirclePause,
  House,
  Radio,
  Search,
  SearchX,
  Truck,
  Wrench,
} from 'lucide-react'

export const FUSO = 'America/Sao_Paulo'

export function dataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function data(iso) {
  if (!iso) return '—'
  // Datas "AAAA-MM-DD" (sem hora) não devem sofrer conversão de fuso.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [a, m, d] = iso.split('-')
    return `${d}/${m}/${a}`
  }
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: FUSO })
}

export function hojeISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(new Date())
}

export const ESPECIES = { gato: 'Gato', cachorro: 'Cachorro' }

export const STATUS_OCORRENCIA = {
  aberta: {
    rotulo: 'Aberta',
    cor: 'bg-alerta-100 text-alerta-800 ring-alerta-400',
    icone: CircleAlert,
  },
  em_atendimento: {
    rotulo: 'Em atendimento',
    cor: 'bg-sky-100 text-sky-900 ring-sky-300',
    icone: Truck,
  },
  resgatado: {
    rotulo: 'Resgatado',
    cor: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    icone: CircleCheck,
  },
  nao_encontrado: {
    rotulo: 'Não encontrado',
    cor: 'bg-stone-200 text-stone-800 ring-stone-300',
    icone: SearchX,
  },
  encaminhado_tutor: {
    rotulo: 'Encaminhado ao tutor',
    cor: 'bg-violet-100 text-violet-900 ring-violet-300',
    icone: House,
  },
}

export const STATUS_DISPOSITIVO = {
  ativo: { rotulo: 'Ativo', cor: 'bg-emerald-100 text-emerald-900 ring-emerald-300', icone: Radio },
  manutencao: {
    rotulo: 'Em manutenção',
    cor: 'bg-amber-100 text-amber-900 ring-amber-300',
    icone: Wrench,
  },
  inativo: {
    rotulo: 'Inativo',
    cor: 'bg-stone-200 text-stone-800 ring-stone-300',
    icone: CirclePause,
  },
}

export const STATUS_PERDIDO = {
  ativo: {
    rotulo: 'Procurando',
    cor: 'bg-alerta-100 text-alerta-800 ring-alerta-400',
    icone: Search,
  },
  encontrado: {
    rotulo: 'Encontrado',
    cor: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    icone: CircleCheck,
  },
}

export const PAPEIS = { tutor: 'Tutor', ong: 'ONG', coordenacao: 'Coordenação' }

// Centro padrão do mapa: região da FIAP Paulista, em São Paulo.
export const CENTRO_SP = { lat: -23.5629, lng: -46.6544 }
