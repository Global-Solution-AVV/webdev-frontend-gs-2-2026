// Textos e formatações exibidos na interface.
import {
  Ban,
  CircleAlert,
  CircleCheck,
  CirclePause,
  Cpu,
  House,
  PackageOpen,
  Radio,
  ScanLine,
  Search,
  SearchX,
  Thermometer,
  Truck,
  Utensils,
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

/** Estados publicados pelo ESP32 (MQTT), com cor, ícone e texto para o painel ao vivo. */
export const ESTADOS_PONTO = {
  AGUARDANDO: {
    rotulo: 'Aguardando',
    cor: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    icone: Radio,
  },
  MOVIMENTO: { rotulo: 'Movimento', cor: 'bg-sky-100 text-sky-900 ring-sky-300', icone: ScanLine },
  ANIMAL_CONFIRMADO: {
    rotulo: 'Animal confirmado',
    cor: 'bg-sky-100 text-sky-900 ring-sky-300',
    icone: Utensils,
  },
  LENDO_CHIP: {
    rotulo: 'Lendo chip',
    cor: 'bg-sky-100 text-sky-900 ring-sky-300',
    icone: ScanLine,
  },
  CHIP_ENCONTRADO: {
    rotulo: 'Chip encontrado',
    cor: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
    icone: CircleCheck,
  },
  SEM_CHIP: {
    rotulo: 'Sem chip',
    cor: 'bg-violet-100 text-violet-900 ring-violet-300',
    icone: Search,
  },
  BLOQUEADO: { rotulo: 'Bloqueado', cor: 'bg-stone-200 text-stone-800 ring-stone-300', icone: Ban },
  ESTOQUE_BAIXO: {
    rotulo: 'Estoque baixo',
    cor: 'bg-alerta-100 text-alerta-800 ring-alerta-400',
    icone: PackageOpen,
  },
  RACAO_EM_RISCO: {
    rotulo: 'Ração em risco',
    cor: 'bg-alerta-100 text-alerta-800 ring-alerta-400',
    icone: Thermometer,
  },
  FALHA: { rotulo: 'Falha de sensor', cor: 'bg-rose-100 text-rose-900 ring-rose-300', icone: Cpu },
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
