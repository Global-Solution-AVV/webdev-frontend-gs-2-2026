// Popula o Supabase com dados FICTÍCIOS para demonstração.
// Uso: node --env-file=.env scripts/seed.js   (ou: npm run seed)
// Rode o supabase/schema.sql antes. O script pode ser rodado de novo: ele apaga e recria os dados de demo.
//
// Volume: 30 tutores (5 com login divulgado + 25 extras), 50 pets com chip (10 perdidos com
// cartaz público e 7 encontrados), 12 pontos com leituras COM chip e avistamentos SEM chip.
//
// Cenários cobertos:
// - ocorrências em todos os status: aberta, em atendimento, reserva vencida (reabre ao ler),
//   resgatado, não encontrado e encaminhado ao tutor;
// - DV-003 a um dia de abrir ocorrência (simule um cachorro sem chip hoje para ver abrir);
// - pets em modo perdido (alerta imediato) e fora dele (aviso diário, com e sem resposta);
// - animais perdidos sem chip, um já encontrado após o tutor reconhecer um avistamento;
// - ponto com estoque baixo, ponto em manutenção, ONG sem vagas, leituras descartadas
//   e um chip lido que não tem cadastro.
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const url = process.env.SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !chave) {
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}
const db = createClient(url, chave, { auth: { persistSession: false } })
const SENHA = 'devolta123'
const hash = (k) => createHash('sha256').update(k).digest('hex')

function ok({ data, error }, contexto) {
  if (error) throw new Error(`${contexto}: ${error.message}`)
  return data
}

// Horário em São Paulo, `dias` atrás, na hora:minuto indicada.
function emSP(dias, hora, minuto = 0) {
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  )
  const base = new Date(`${hoje}T00:00:00-03:00`).getTime() - dias * 86400000
  return new Date(base + (hora * 60 + minuto) * 60000).toISOString()
}
const horasAtras = (h) => new Date(Date.now() - h * 3600000).toISOString()
const horaCurta = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  })

// ---------------------------------------------------------------- pessoas

const USUARIOS = [
  { email: 'coordenacao@devolta.demo', nome: 'Coordenação DeVolta', papel: 'coordenacao' },
  {
    email: 'ana.tutora@devolta.demo',
    nome: 'Ana (fictícia)',
    papel: 'tutor',
    telefone: '(11) 90000-0001',
  },
  {
    email: 'bruno.tutor@devolta.demo',
    nome: 'Bruno (fictício)',
    papel: 'tutor',
    telefone: '(11) 90000-0002',
  },
  {
    email: 'carla.tutora@devolta.demo',
    nome: 'Carla (fictícia)',
    papel: 'tutor',
    telefone: '(11) 90000-0003',
  },
  {
    email: 'diego.tutor@devolta.demo',
    nome: 'Diego (fictício)',
    papel: 'tutor',
    telefone: '(11) 90000-0004',
  },
  {
    email: 'elisa.tutora@devolta.demo',
    nome: 'Elisa (fictícia)',
    papel: 'tutor',
    telefone: '(11) 90000-0005',
  },
  { email: 'patas@devolta.demo', nome: 'ONG Patas Livres (fictícia)', papel: 'ong' },
  { email: 'abrigo@devolta.demo', nome: 'Abrigo Bom Lar (fictício)', papel: 'ong' },
  { email: 'resgate.sul@devolta.demo', nome: 'Resgate Zona Sul (fictícia)', papel: 'ong' },
  { email: 'miados@devolta.demo', nome: 'Miados & Latidos (fictícia)', papel: 'ong' },
  { email: 'lar.leste@devolta.demo', nome: 'Lar Temporário Leste (fictício)', papel: 'ong' },
]

const ONGS = [
  {
    email: 'patas@devolta.demo',
    contato: 'contato@patas.demo',
    lat: -23.5614,
    lng: -46.6559,
    raio_km: 6,
    vagas: 3,
  },
  {
    email: 'abrigo@devolta.demo',
    contato: '(11) 4000-0000',
    lat: -23.575,
    lng: -46.64,
    raio_km: 4,
    vagas: 0,
  },
  {
    email: 'resgate.sul@devolta.demo',
    contato: 'resgate@sul.demo',
    lat: -23.645,
    lng: -46.7,
    raio_km: 6,
    vagas: 5,
  },
  {
    email: 'miados@devolta.demo',
    contato: '(11) 4000-0004',
    lat: -23.5615,
    lng: -46.69,
    raio_km: 5,
    vagas: 2,
  },
  {
    email: 'lar.leste@devolta.demo',
    contato: 'lar@leste.demo',
    lat: -23.548,
    lng: -46.585,
    raio_km: 8,
    vagas: 4,
  },
]

const FOTOS_GATO = ['millie', 'neo', 'bella', 'poppy', 'louie', 'neo_banana'].map(
  (n) => `https://placecats.com/${n}/300/200`,
)

// Tutores extras: só para dar volume aos dados (não aparecem na tela de login, mas entram
// com a mesma senha). E-mails tutor06@devolta.demo ... tutor30@devolta.demo.
const TUTORES_EXTRAS = [
  ['Fernanda Lima', 'a'],
  ['Gustavo Rocha', 'o'],
  ['Helena Prado', 'a'],
  ['Igor Mendes', 'o'],
  ['Juliana Castro', 'a'],
  ['Kleber Nunes', 'o'],
  ['Larissa Duarte', 'a'],
  ['Marcos Teixeira', 'o'],
  ['Natália Freitas', 'a'],
  ['Otávio Ramos', 'o'],
  ['Patrícia Vieira', 'a'],
  ['Rafael Moura', 'o'],
  ['Sabrina Lopes', 'a'],
  ['Thiago Barros', 'o'],
  ['Vanessa Pires', 'a'],
  ['Wagner Cardoso', 'o'],
  ['Yasmin Farias', 'a'],
  ['André Correia', 'o'],
  ['Beatriz Moraes', 'a'],
  ['Caio Fernandes', 'o'],
  ['Débora Campos', 'a'],
  ['Eduardo Rezende', 'o'],
  ['Flávia Antunes', 'a'],
  ['Gabriel Siqueira', 'o'],
  ['Isabela Monteiro', 'a'],
].map(([nome, g], i) => {
  const n = String(i + 6).padStart(2, '0')
  return {
    email: `tutor${n}@devolta.demo`,
    nome: `${nome} (fictíci${g})`,
    papel: 'tutor',
    telefone: `(11) 90000-00${n}`,
    extra: true,
  }
})
USUARIOS.push(...TUTORES_EXTRAS)

// Pets com chip. modo_perdido = tutor avisou que sumiu → cada leitura vira alerta imediato.
const PETS = [
  {
    apelido: 'mingau',
    tutor: 'ana.tutora',
    nome: 'Mingau',
    especie: 'gato',
    foto: 'https://placecats.com/millie/300/200',
  },
  {
    apelido: 'pacoca',
    tutor: 'ana.tutora',
    nome: 'Paçoca',
    especie: 'cachorro',
    perdido: true,
    // Cartaz público: [dias atrás que sumiu, dias atrás que foi encontrado | null, texto]
    cartaz: [
      2,
      null,
      'Caramelo de porte médio, coleira azul. Fugiu perto da Av. Paulista e é medroso.',
    ],
    foto: 'https://placedog.net/300/200?id=12',
  },
  {
    apelido: 'thor',
    tutor: 'bruno.tutor',
    nome: 'Thor',
    especie: 'cachorro',
    cartaz: [12, 9, 'Preto com peito branco, atende pelo nome.'],
    foto: 'https://placedog.net/300/200?id=21',
  },
  {
    apelido: 'nina',
    tutor: 'carla.tutora',
    nome: 'Nina',
    especie: 'gato',
    cartaz: [7, 5, 'Gata cinza rajada, olhos verdes.'],
    foto: 'https://placecats.com/neo/300/200',
  },
  {
    apelido: 'bolt',
    tutor: 'carla.tutora',
    nome: 'Bolt',
    especie: 'cachorro',
    foto: 'https://placedog.net/300/200?id=33',
  },
  {
    apelido: 'frida',
    tutor: 'diego.tutor',
    nome: 'Frida',
    especie: 'gato',
    perdido: true,
    cartaz: [4, null, 'Tricolor, castrada, muito mansa. Sumiu na região da Vila Mariana.'],
    foto: 'https://placecats.com/bella/300/200',
  },
  {
    apelido: 'pipoca',
    tutor: 'diego.tutor',
    nome: 'Pipoca',
    especie: 'cachorro',
    foto: 'https://placedog.net/300/200?id=45',
  },
  { apelido: 'tobias', tutor: 'elisa.tutora', nome: 'Tobias', especie: 'cachorro', foto: null },
]

// Pets dos tutores extras: [nome, espécie, situação do cartaz, texto do cartaz].
// Situação: null (nunca se perdeu) · ['perdido', dias que sumiu] · ['encontrado', sumiu, voltou].
// Os 17 primeiros tutores extras têm 2 pets; os outros 8, um pet cada.
const PETS_EXTRAS = [
  [
    'Amora',
    'gato',
    ['perdido', 3],
    'Preta com uma mancha branca no peito. Fugiu pela janela na Bela Vista.',
  ],
  ['Bento', 'cachorro', null],
  [
    'Cacau',
    'cachorro',
    ['perdido', 6],
    'Marrom, porte pequeno, coleira vermelha com plaquinha. Sumiu perto da Aclimação.',
  ],
  ['Dengo', 'gato', null],
  ['Estrela', 'gato', ['encontrado', 15, 11], 'Branca com olhos azuis, surda.'],
  ['Fubá', 'cachorro', null],
  [
    'Godofredo',
    'cachorro',
    ['perdido', 9],
    'Basset idoso, anda devagar e precisa de remédio. Visto pela última vez em Pinheiros.',
  ],
  ['Jade', 'gato', null],
  ['Kiko', 'cachorro', null],
  ['Lola', 'cachorro', ['encontrado', 20, 17], 'Poodle branca, tosa recente.'],
  ['Mel', 'gato', null],
  [
    'Nescau',
    'cachorro',
    ['perdido', 4],
    'Vira-lata chocolate, muito brincalhão. Escapou no Tatuapé durante um passeio.',
  ],
  ['Olívia', 'gato', null],
  ['Pingo', 'cachorro', null],
  [
    'Quindim',
    'gato',
    ['perdido', 12],
    'Laranja, gordinho e dócil. Some às vezes, mas nunca por tanto tempo. Região da Mooca.',
  ],
  ['Rex', 'cachorro', null],
  ['Sushi', 'gato', ['encontrado', 9, 6], 'Siamês, mia muito alto.'],
  ['Tequila', 'cachorro', null],
  ['Uva', 'gato', null],
  [
    'Valente',
    'cachorro',
    ['perdido', 5],
    'Pastor alemão jovem, usa coleira de couro. Fugiu com medo de fogos em Santana.',
  ],
  ['Xodó', 'gato', null],
  ['Zeca', 'cachorro', null],
  ['Biscoito', 'cachorro', ['encontrado', 6, 4], 'Beagle tricolor, atende pelo nome.'],
  ['Canela', 'gato', null],
  ['Duque', 'cachorro', null],
  [
    'Faísca',
    'gato',
    ['perdido', 7],
    'Rajada de cinza, rabo curto. Sumiu na Vila Mariana, perto da clínica.',
  ],
  ['Gaia', 'cachorro', null],
  ['Hulk', 'cachorro', null],
  ['Iara', 'gato', ['encontrado', 25, 21], 'Persa creme, pelo longo.'],
  ['Juca', 'cachorro', null],
  ['Lua', 'gato', null],
  [
    'Max',
    'cachorro',
    ['perdido', 3],
    'Labrador amarelo, castrado, muito amigável. Visto pela última vez no Butantã.',
  ],
  ['Nala', 'gato', null],
  ['Oreo', 'cachorro', null],
  ['Pandora', 'gato', null],
  ['Rajada', 'gato', null],
  ['Simba', 'gato', null],
  ['Tapioca', 'cachorro', null],
  ['Bolinha', 'cachorro', null],
  ['Fumaça', 'gato', null],
  ['Pretinha', 'cachorro', null],
  ['Chico', 'cachorro', null],
]
let fotoPetN = 0
PETS.push(
  ...PETS_EXTRAS.map(([nome, especie, sit, texto], k) => {
    const dono = k < 34 ? Math.floor(k / 2) : k - 17
    fotoPetN++
    return {
      apelido: `extra${k}`,
      tutor: TUTORES_EXTRAS[dono].email.split('@')[0],
      nome,
      especie,
      perdido: sit?.[0] === 'perdido',
      cartaz: sit ? [sit[1], sit[0] === 'encontrado' ? sit[2] : null, texto] : undefined,
      // Alguns sem foto, como na vida real.
      foto:
        k % 9 === 8
          ? null
          : especie === 'gato'
            ? FOTOS_GATO[fotoPetN % FOTOS_GATO.length]
            : `https://placedog.net/300/200?id=${60 + k}`,
    }
  }),
)

// ---------------------------------------------------------------- pontos

const DISPOSITIVOS = [
  {
    codigo: 'DV-001',
    local_nome: 'Clínica veterinária · Av. Paulista',
    lat: -23.5629,
    lng: -46.6544,
    estoque_g: 3000,
  },
  {
    codigo: 'DV-002',
    local_nome: 'Praça perto da R. Augusta',
    lat: -23.556,
    lng: -46.662,
    estoque_g: 1800,
  },
  {
    codigo: 'DV-003',
    local_nome: 'Pet shop · Parque da Aclimação',
    lat: -23.5726,
    lng: -46.629,
    estoque_g: 2500,
  },
  {
    codigo: 'DV-004',
    local_nome: 'Clínica veterinária · Vila Mariana',
    lat: -23.588,
    lng: -46.634,
    estoque_g: 300,
  },
  {
    codigo: 'DV-005',
    local_nome: 'Praça Benedito Calixto · Pinheiros',
    lat: -23.556,
    lng: -46.6826,
    estoque_g: 2200,
  },
  {
    codigo: 'DV-006',
    local_nome: 'Pet shop · Lapa',
    lat: -23.5235,
    lng: -46.7016,
    estoque_g: 1500,
  },
  {
    codigo: 'DV-007',
    local_nome: 'Clínica veterinária · Tatuapé',
    lat: -23.5403,
    lng: -46.5763,
    estoque_g: 2800,
  },
  { codigo: 'DV-008', local_nome: 'Parque da Mooca', lat: -23.559, lng: -46.599, estoque_g: 900 },
  {
    codigo: 'DV-009',
    local_nome: 'Pet shop · Santana',
    lat: -23.502,
    lng: -46.625,
    estoque_g: 2000,
  },
  {
    codigo: 'DV-010',
    local_nome: 'Clínica veterinária · Santo Amaro',
    lat: -23.654,
    lng: -46.709,
    estoque_g: 2600,
  },
  {
    codigo: 'DV-011',
    local_nome: 'Praça em Moema · perto do Ibirapuera',
    lat: -23.601,
    lng: -46.662,
    estoque_g: 1200,
    status: 'manutencao',
  },
  {
    codigo: 'DV-012',
    local_nome: 'Pet shop · Butantã',
    lat: -23.571,
    lng: -46.708,
    estoque_g: 1700,
  },
]

const FOTO = {
  gato: ['millie', 'neo', 'bella', 'poppy', 'louie', 'neo_banana'].map(
    (n) => `https://placecats.com/${n}/320/240`,
  ),
  cachorro: [3, 7, 14, 18, 25, 29, 37, 41].map((n) => `https://placedog.net/320/240?id=${n}`),
}
let fotoN = 0
const fotoDe = (especie) => FOTO[especie][fotoN++ % FOTO[especie].length]

// Avistamentos SEM chip por ponto: [espécie, dias atrás, hora, minuto].
// Cuidado: a mesma espécie em dias 1 e 2 sem ocorrência faz a próxima detecção abrir uma
// (só o DV-003 está assim de propósito).
const AVISTAMENTOS_SOLTOS = {
  'DV-001': [
    ['gato', 5, 20, 15],
    ['gato', 18, 21, 0],
    ['cachorro', 1, 8, 5],
    ['cachorro', 4, 8, 40],
  ],
  'DV-002': [['cachorro', 6, 15, 20]],
  'DV-003': [
    ['cachorro', 2, 7, 30],
    ['cachorro', 1, 7, 45],
    ['gato', 6, 19, 10],
  ],
  'DV-004': [
    ['gato', 1, 23, 5],
    ['gato', 5, 22, 30],
    ['cachorro', 3, 13, 0],
  ],
  'DV-005': [['gato', 2, 18, 40]],
  'DV-006': [
    ['gato', 1, 6, 50],
    ['gato', 3, 7, 10],
    ['cachorro', 2, 16, 0],
  ],
  'DV-007': [
    ['cachorro', 1, 10, 20],
    ['cachorro', 20, 9, 0],
  ],
  'DV-008': [['gato', 3, 20, 0]],
  'DV-009': [['cachorro', 1, 12, 30]],
  'DV-010': [
    ['gato', 2, 21, 15],
    ['gato', 4, 22, 0],
    ['gato', 25, 20, 0],
  ],
  'DV-011': [
    ['gato', 9, 19, 0],
    ['cachorro', 8, 11, 0],
  ],
  'DV-012': [['gato', 5, 17, 0]],
}

// Mais avistamentos em todos os pontos, de 8 a 17 dias atrás (não formam 3 dias seguidos).
DISPOSITIVOS.forEach((d, i) => {
  const [a, b] = i % 2 ? ['gato', 'cachorro'] : ['cachorro', 'gato']
  AVISTAMENTOS_SOLTOS[d.codigo].push([a, 8 + (i % 4), 19, 10 * (i % 6)])
  AVISTAMENTOS_SOLTOS[d.codigo].push([b, 13 + (i % 5), 7, 5 * (i % 10)])
})

// Leituras COM chip: [ponto, pet, dias atrás, hora, minuto, resposta do tutor, lida].
const LEITURAS_CHIP = [
  ['DV-001', 'mingau', 3, 9, 10, 'ok', true],
  ['DV-001', 'mingau', 1, 18, 20, null, false],
  ['DV-001', 'thor', 2, 10, 0, 'ok', true],
  ['DV-002', 'nina', 2, 19, 30, null, true],
  ['DV-003', 'pacoca', 1, 6, 15, null, true],
  ['DV-003', 'pacoca', 1, 17, 40, null, false],
  ['DV-004', 'bolt', 1, 12, 0, null, false],
  ['DV-005', 'frida', 2, 7, 5, null, false],
  ['DV-006', 'pipoca', 4, 9, 30, 'ok', true],
  ['DV-006', 'pipoca', 1, 9, 45, null, false],
  ['DV-007', 'tobias', 2, 15, 10, 'ok', true],
  ['DV-008', 'nina', 5, 8, 0, 'ok', true],
  ['DV-009', 'thor', 6, 11, 20, 'ok', true],
  ['DV-010', 'bolt', 3, 14, 0, 'ok', true],
  ['DV-011', 'frida', 8, 20, 30, null, true],
  ['DV-012', 'pipoca', 2, 18, 0, null, true],
]

// Leituras dos pets extras, espalhadas pelos 12 pontos. Perdidos: 2 alertas depois do sumiço.
// Os outros: 1 aviso (e um 2º, em outro dia, para 1 em cada 3), respeitando 1 aviso por dia.
PETS_EXTRAS.forEach(([, , sit], k) => {
  const cod = (n) => `DV-${String((n % 12) + 1).padStart(3, '0')}`
  const h = 6 + ((k * 7) % 15)
  const m = (k * 13) % 60
  if (sit?.[0] === 'perdido') {
    LEITURAS_CHIP.push([cod(k), `extra${k}`, 2, h, m, null, true])
    LEITURAS_CHIP.push([cod(k + 5), `extra${k}`, 1, (h + 3) % 24, m, null, false])
    return
  }
  const dias = 1 + (k % 5)
  LEITURAS_CHIP.push([cod(k * 5), `extra${k}`, dias, h, m, dias === 1 ? null : 'ok', dias !== 1])
  if (k % 3 === 0) LEITURAS_CHIP.push([cod(k * 5 + 7), `extra${k}`, dias + 3, h, m, 'ok', true])
})

// Leituras descartadas (o filtro de categoria barra) e um chip sem cadastro.
const DESCARTADAS = [
  ['DV-001', 'pessoa', 0.91, 1, 14, 0],
  ['DV-006', 'passaro', 0.77, 2, 6, 30],
  ['DV-009', 'pessoa', 0.88, 3, 10, 0],
]
const CHIP_SEM_CADASTRO = {
  ponto: 'DV-006',
  especie: 'cachorro',
  chip: '981020000009999',
  dias: 2,
  hora: 16,
  minuto: 5,
}

// Ocorrências de resgate: avistamentos ligados + histórico com cada mudança de status.
const OCORRENCIAS = [
  {
    ponto: 'DV-002',
    especie: 'gato',
    status: 'aberta',
    avistamentos: [
      [4, 21, 10],
      [3, 22, 17],
      [2, 21, 24],
      [1, 22, 31],
    ],
    historico: [
      {
        dias: 2,
        hora: 21,
        min: 30,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
    ],
  },
  {
    ponto: 'DV-012',
    especie: 'cachorro',
    status: 'aberta',
    avistamentos: [
      [3, 7, 0],
      [2, 7, 20],
      [1, 6, 50],
    ],
    historico: [
      {
        dias: 1,
        hora: 7,
        min: 0,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
    ],
  },
  {
    ponto: 'DV-005',
    especie: 'cachorro',
    status: 'em_atendimento',
    ong: 'miados@devolta.demo',
    reservadaHorasAtras: 3,
    avistamentos: [
      [5, 6, 40],
      [4, 7, 15],
      [3, 6, 55],
      [1, 7, 30],
    ],
    historico: [
      {
        dias: 3,
        hora: 7,
        min: 0,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
      {
        horasAtras: 3,
        de: 'aberta',
        novo: 'em_atendimento',
        ong: 'miados@devolta.demo',
        obs: 'Equipe a caminho no horário da manhã',
      },
    ],
  },
  {
    // Reservada há 30 h sem atualização: ao abrir a lista, a API reabre (expiração de 24 h).
    ponto: 'DV-009',
    especie: 'gato',
    status: 'em_atendimento',
    ong: 'patas@devolta.demo',
    reservadaHorasAtras: 30,
    avistamentos: [
      [4, 20, 10],
      [3, 20, 40],
      [2, 21, 5],
    ],
    historico: [
      {
        dias: 2,
        hora: 21,
        min: 10,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
      {
        horasAtras: 30,
        de: 'aberta',
        novo: 'em_atendimento',
        ong: 'patas@devolta.demo',
        obs: 'Vamos tentar à noite',
      },
    ],
  },
  {
    ponto: 'DV-007',
    especie: 'gato',
    status: 'resgatado',
    ong: 'lar.leste@devolta.demo',
    fim: 6,
    avistamentos: [
      [9, 19, 0],
      [8, 19, 40],
      [7, 20, 5],
    ],
    historico: [
      {
        dias: 7,
        hora: 20,
        min: 10,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
      {
        dias: 7,
        hora: 21,
        min: 0,
        de: 'aberta',
        novo: 'em_atendimento',
        ong: 'lar.leste@devolta.demo',
      },
      {
        dias: 6,
        hora: 20,
        min: 30,
        de: 'em_atendimento',
        novo: 'resgatado',
        ong: 'lar.leste@devolta.demo',
        obs: 'Gata adulta resgatada, está em lar temporário',
      },
    ],
  },
  {
    ponto: 'DV-010',
    especie: 'cachorro',
    status: 'nao_encontrado',
    ong: 'resgate.sul@devolta.demo',
    fim: 5,
    avistamentos: [
      [8, 9, 0],
      [7, 9, 20],
      [6, 8, 45],
    ],
    historico: [
      {
        dias: 6,
        hora: 9,
        min: 0,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
      {
        dias: 6,
        hora: 10,
        min: 0,
        de: 'aberta',
        novo: 'em_atendimento',
        ong: 'resgate.sul@devolta.demo',
      },
      {
        dias: 5,
        hora: 11,
        min: 0,
        de: 'em_atendimento',
        novo: 'nao_encontrado',
        ong: 'resgate.sul@devolta.demo',
        obs: 'Procuramos por 2 h e não achamos',
      },
    ],
  },
  {
    ponto: 'DV-008',
    especie: 'cachorro',
    status: 'encaminhado_tutor',
    ong: 'lar.leste@devolta.demo',
    fim: 9,
    avistamentos: [
      [12, 16, 0],
      [11, 16, 30],
      [10, 17, 0],
    ],
    historico: [
      {
        dias: 10,
        hora: 17,
        min: 10,
        novo: 'aberta',
        obs: 'Avistado em 3 dias seguidos sem tutor identificado',
      },
      {
        dias: 10,
        hora: 18,
        min: 0,
        de: 'aberta',
        novo: 'em_atendimento',
        ong: 'lar.leste@devolta.demo',
      },
      {
        dias: 9,
        hora: 15,
        min: 0,
        de: 'em_atendimento',
        novo: 'encaminhado_tutor',
        ong: 'lar.leste@devolta.demo',
        obs: 'A tutora apareceu com fotos e levou o cachorro para casa',
      },
    ],
  },
]

// Animais perdidos SEM chip (o tutor compara com os avistamentos próximos).
const PERDIDOS = [
  {
    apelido: 'caramelo',
    tutor: 'bruno.tutor',
    nome: 'Caramelo',
    especie: 'cachorro',
    descricao: 'Vira-lata caramelo, porte médio, coleira azul.',
    lat: -23.5715,
    lng: -46.631,
    dias: 5,
  },
  {
    apelido: 'bidu',
    tutor: 'carla.tutora',
    nome: 'Bidu',
    especie: 'cachorro',
    descricao: 'Pelo preto, orelhas caídas, muito medroso.',
    lat: -23.65,
    lng: -46.705,
    dias: 10,
    foto: 'https://placedog.net/300/200?id=52',
  },
  {
    apelido: 'luna',
    tutor: 'elisa.tutora',
    nome: 'Luna',
    especie: 'gato',
    descricao: 'Gata cinza rajada, olhos verdes.',
    lat: -23.561,
    lng: -46.656,
    dias: 7,
    status: 'encontrado',
    reconhece: { ponto: 'DV-001', dias: 5 },
  },
]

// ---------------------------------------------------------------- execução

async function limpar() {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 })
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith('@devolta.demo')) await db.auth.admin.deleteUser(u.id)
  }
  await db
    .from('dispositivos')
    .delete()
    .in(
      'codigo',
      DISPOSITIVOS.map((d) => d.codigo),
    )
}

async function criarUsuarios() {
  const ids = {}
  for (const u of USUARIOS) {
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: SENHA,
      email_confirm: true,
      user_metadata: {
        nome: u.nome,
        papel: u.papel === 'coordenacao' ? 'tutor' : u.papel,
        telefone: u.telefone,
      },
    })
    if (error) throw new Error(`Usuário ${u.email}: ${error.message}`)
    // O gatilho cria o perfil; garantimos papel/nome aqui (coordenação só existe via seed).
    ok(
      await db
        .from('perfis')
        .upsert({ id: data.user.id, papel: u.papel, nome: u.nome, telefone: u.telefone ?? null }),
      'Perfil',
    )
    ids[u.email] = data.user.id
  }
  return ids
}

/** Insere detecções e devolve as linhas na mesma ordem. */
async function inserirDeteccoes(linhas) {
  return ok(await db.from('deteccoes').insert(linhas).select('id'), 'Detecções')
}

async function main() {
  console.log('Limpando dados de demonstração anteriores...')
  await limpar()

  console.log('Criando usuários...')
  const ids = await criarUsuarios()
  const idTutor = (apelido) => ids[`${apelido}@devolta.demo`]

  console.log('Criando pontos de identificação...')
  const disp = ok(
    await db
      .from('dispositivos')
      .insert(
        DISPOSITIVOS.map((d) => ({
          codigo: d.codigo,
          local_nome: d.local_nome,
          lat: d.lat,
          lng: d.lng,
          estoque_g: d.estoque_g,
          estoque_minimo_g: 500,
          limite_porcoes_dia: 10,
          porcao_g: 20,
          status: d.status ?? 'ativo',
          api_key_hash: hash(`dv_demo_${d.codigo}`),
        })),
      )
      .select(),
    'Dispositivos',
  )
  const ponto = Object.fromEntries(disp.map((d) => [d.codigo, d]))

  console.log('Criando ONGs...')
  const ongs = ok(
    await db
      .from('ongs')
      .insert(
        ONGS.map((o) => ({
          perfil_id: ids[o.email],
          nome: USUARIOS.find((u) => u.email === o.email).nome,
          contato_publico: o.contato,
          lat: o.lat,
          lng: o.lng,
          raio_km: o.raio_km,
          vagas: o.vagas,
        })),
      )
      .select(),
    'ONGs',
  )
  const ongPorEmail = Object.fromEntries(ONGS.map((o, i) => [o.email, ongs[i]]))

  console.log('Criando pets com chip...')
  const pets = ok(
    await db
      .from('pets')
      .insert(
        PETS.map((p, i) => ({
          tutor_id: idTutor(p.tutor),
          nome: p.nome,
          especie: p.especie,
          chip: `981020000000${String(i + 1).padStart(3, '0')}`,
          foto_url: p.foto,
          modo_perdido: Boolean(p.perdido),
          // Todas as linhas com as mesmas chaves (o insert em lote grava null nas que faltam).
          cartaz_publico: Boolean(p.cartaz),
          cartaz_descricao: p.cartaz?.[2] ?? null,
          perdido_desde: p.cartaz ? emSP(p.cartaz[0], 18, 0) : null,
          encontrado_em: p.cartaz?.[1] != null ? emSP(p.cartaz[1], 10, 30) : null,
        })),
      )
      .select(),
    'Pets',
  )
  const pet = Object.fromEntries(PETS.map((p, i) => [p.apelido, pets[i]]))

  console.log('Criando leituras de chip e avisos aos tutores...')
  const detChip = LEITURAS_CHIP.map(([cod, apelido, dias, h, m]) => {
    const p = pet[apelido]
    return {
      dispositivo_id: ponto[cod].id,
      categoria: p.especie,
      confidence: 0.93,
      chip: p.chip,
      resultado: 'tutor',
      motivo: `SMS enviado para o tutor do chip ${p.chip} (${p.modo_perdido ? 'modo perdido' : 'aviso diário'})`,
      porcao_liberada: ponto[cod].status === 'ativo',
      criado_em: emSP(dias, h, m),
    }
  })
  await inserirDeteccoes(detChip)
  ok(
    await db.from('notificacoes').insert(
      LEITURAS_CHIP.map(([cod, apelido, dias, h, m, resposta, lida]) => {
        const p = pet[apelido]
        const quando = emSP(dias, h, m)
        const local = ponto[cod].local_nome
        return {
          pet_id: p.id,
          tutor_id: p.tutor_id,
          dispositivo_id: ponto[cod].id,
          tipo: p.modo_perdido ? 'imediato' : 'diario',
          mensagem: p.modo_perdido
            ? `ALERTA: ${p.nome} (chip ${p.chip}) foi identificado(a) agora em ${local}, às ${horaCurta(quando)}.`
            : `${p.nome} (chip ${p.chip}) passou por ${local} às ${horaCurta(quando)}. Está tudo bem?`,
          resposta,
          lida,
          criado_em: quando,
        }
      }),
    ),
    'Notificações',
  )
  for (const p of pets) {
    const ultimos = LEITURAS_CHIP.filter(([, a]) => pet[a].id === p.id).map(([, , d, h, m]) =>
      emSP(d, h, m),
    )
    if (ultimos.length) {
      ok(
        await db
          .from('pets')
          .update({ ultimo_aviso_em: ultimos.sort().at(-1) })
          .eq('id', p.id),
        'Último aviso',
      )
    }
  }

  console.log('Criando leituras descartadas...')
  await inserirDeteccoes(
    DESCARTADAS.map(([cod, categoria, conf, dias, h, m]) => ({
      dispositivo_id: ponto[cod].id,
      categoria,
      confidence: conf,
      chip: null,
      resultado: 'descartada',
      motivo: `Categoria "${categoria}" não é gato nem cachorro`,
      porcao_liberada: false,
      criado_em: emSP(dias, h, m),
    })),
  )

  // Avistamento sem chip = detecção (resultado "avistamento") + linha em avistamentos.
  async function criarAvistamentos(itens) {
    if (!itens.length) return []
    const dets = await inserirDeteccoes(
      itens.map((a) => ({
        dispositivo_id: ponto[a.ponto].id,
        categoria: a.especie,
        confidence: 0.82 + (fotoN % 15) / 100,
        chip: a.chip ?? null,
        resultado: 'avistamento',
        motivo: a.chip ? `Chip ${a.chip} sem cadastro; registrado como avistamento` : 'Sem chip',
        porcao_liberada: ponto[a.ponto].status === 'ativo',
        criado_em: a.quando,
      })),
    )
    return ok(
      await db
        .from('avistamentos')
        .insert(
          itens.map((a, i) => ({
            dispositivo_id: ponto[a.ponto].id,
            deteccao_id: dets[i].id,
            especie: a.especie,
            foto_url: fotoDe(a.especie),
            lat: ponto[a.ponto].lat,
            lng: ponto[a.ponto].lng,
            ocorrencia_id: a.ocorrenciaId ?? null,
            criado_em: a.quando,
          })),
        )
        .select('id, dispositivo_id, criado_em'),
      'Avistamentos',
    )
  }

  console.log('Criando avistamentos sem chip...')
  const soltos = await criarAvistamentos([
    ...Object.entries(AVISTAMENTOS_SOLTOS).flatMap(([cod, lista]) =>
      lista.map(([especie, dias, h, m]) => ({ ponto: cod, especie, quando: emSP(dias, h, m) })),
    ),
    {
      ponto: CHIP_SEM_CADASTRO.ponto,
      especie: CHIP_SEM_CADASTRO.especie,
      chip: CHIP_SEM_CADASTRO.chip,
      quando: emSP(CHIP_SEM_CADASTRO.dias, CHIP_SEM_CADASTRO.hora, CHIP_SEM_CADASTRO.minuto),
    },
  ])

  console.log('Criando ocorrências de resgate...')
  for (const o of OCORRENCIAS) {
    const primeiro = o.historico[0]
    const quando = (h) => (h.horasAtras ? horasAtras(h.horasAtras) : emSP(h.dias, h.hora, h.min))
    const ultimo = quando(o.historico.at(-1))
    const oc = ok(
      await db
        .from('ocorrencias')
        .insert({
          dispositivo_id: ponto[o.ponto].id,
          especie: o.especie,
          status: o.status,
          ong_id: o.ong ? ongPorEmail[o.ong].id : null,
          reservada_em: o.reservadaHorasAtras ? horasAtras(o.reservadaHorasAtras) : null,
          criado_em: quando(primeiro),
          atualizada_em: ultimo,
        })
        .select()
        .single(),
      `Ocorrência ${o.ponto}`,
    )
    await criarAvistamentos(
      o.avistamentos.map(([dias, h, m]) => ({
        ponto: o.ponto,
        especie: o.especie,
        quando: emSP(dias, h, m),
        ocorrenciaId: oc.id,
      })),
    )
    ok(
      await db.from('ocorrencia_historico').insert(
        o.historico.map((h) => ({
          ocorrencia_id: oc.id,
          status_anterior: h.de ?? null,
          status_novo: h.novo,
          ong_id: h.ong ? ongPorEmail[h.ong].id : null,
          perfil_id: h.ong ? ids[h.ong] : null,
          observacao: h.obs ?? null,
          criado_em: quando(h),
        })),
      ),
      `Histórico ${o.ponto}`,
    )
  }

  console.log('Criando animais perdidos sem chip...')
  for (const p of PERDIDOS) {
    const perdido = ok(
      await db
        .from('animais_perdidos')
        .insert({
          tutor_id: idTutor(p.tutor),
          nome: p.nome,
          especie: p.especie,
          descricao: p.descricao,
          foto_url: p.foto ?? null,
          lat: p.lat,
          lng: p.lng,
          status: p.status ?? 'ativo',
          perdido_em: emSP(p.dias, 12).slice(0, 10),
        })
        .select()
        .single(),
      `Perdido ${p.nome}`,
    )
    if (p.reconhece) {
      const dia = emSP(p.reconhece.dias, 0).slice(0, 10)
      const av = soltos.find(
        (a) =>
          a.dispositivo_id === ponto[p.reconhece.ponto].id &&
          emSP(p.reconhece.dias, 0) <= a.criado_em &&
          a.criado_em < emSP(p.reconhece.dias - 1, 0),
      )
      if (!av) throw new Error(`Avistamento para ${p.nome} em ${dia} não encontrado`)
      ok(
        await db
          .from('avistamentos')
          .update({ reconhecido_por_perdido_id: perdido.id })
          .eq('id', av.id),
        'Reconhecimento',
      )
    }
  }

  const { count: nAv } = await db.from('avistamentos').select('id', { count: 'exact', head: true })
  const { count: nDet } = await db.from('deteccoes').select('id', { count: 'exact', head: true })

  console.log('\nPronto! Contas de demonstração (senha: %s):', SENHA)
  for (const u of USUARIOS.filter((x) => !x.extra)) {
    console.log(`  ${u.papel.padEnd(12)} ${u.email}`)
  }
  console.log(`  + ${TUTORES_EXTRAS.length} tutores extras (tutor06 a tutor30@devolta.demo)`)
  console.log(
    '\nChaves de API dos pontos (cabeçalho X-Device-Key): dv_demo_<código>, ex.: dv_demo_DV-001',
  )
  console.log(
    `\n${DISPOSITIVOS.length} pontos · ${ONGS.length} ONGs · ${PETS.length} pets com chip ` +
      `(${PETS.filter((p) => p.perdido).length} perdidos, ` +
      `${PETS.filter((p) => p.cartaz?.[1] != null).length} encontrados) · ` +
      `${PERDIDOS.length} animais perdidos · ${OCORRENCIAS.length} ocorrências · ` +
      `${nAv} avistamentos · ${nDet} detecções · ${LEITURAS_CHIP.length} avisos a tutores`,
  )
  console.log('Dica: simule um cachorro SEM chip no DV-003 hoje para ver uma ocorrência abrir.')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
