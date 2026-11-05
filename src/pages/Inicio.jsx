import { Link } from 'react-router'
import { ArrowRight, Camera, HandHeart, House, MapPin, PawPrint, Utensils } from 'lucide-react'
import { PainelMapaPublico } from '../components/PainelMapaPublico'
import { useAuth } from '../hooks/useAuth'
import { botao, cartao, selo } from '../lib/estilos'

const PASSOS = [
  {
    icone: Camera,
    titulo: 'O ponto reconhece o animal',
    texto:
      'Instalado em clínicas e pet shops parceiros, o ponto de identificação analisa a imagem no próprio aparelho. Só sai a informação "gato" ou "cachorro".',
  },
  {
    icone: Utensils,
    titulo: 'Uma pequena porção segura o animal',
    texto:
      'A comida é só a isca: enquanto ele come, a antena em volta do prato tenta ler o microchip.',
  },
  {
    icone: House,
    titulo: 'Com chip, o tutor é avisado',
    texto:
      'O sistema manda a mensagem com o local e o horário. O telefone do tutor nunca aparece para ninguém.',
  },
  {
    icone: HandHeart,
    titulo: 'Sem chip, as ONGs entram em ação',
    texto:
      'Se o mesmo animal volta ao ponto por vários dias e ninguém o reconhece, abre-se um pedido de resgate para as ONGs da região com vaga.',
  },
]

const NUMEROS = [
  { valor: '62,2 mi', rotulo: 'cães no Brasil' },
  { valor: '30,8 mi', rotulo: 'gatos no Brasil' },
  { valor: '35%', rotulo: 'vivem nas ruas ou em abrigos' },
]

export function Inicio() {
  const { perfil } = useAuth()
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className={selo}>
            <MapPin aria-hidden="true" size={16} />
            CitizenTech · São Paulo
          </p>
          <h1 className="mt-5 text-5xl leading-[1.05] font-semibold text-tinta sm:text-6xl">
            Todo animal merece voltar <em className="text-marca-700">pra casa.</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-stone-700">
            O DeVolta liga pontos de identificação espalhados pela cidade aos tutores e às ONGs de
            resgate. Quem tem casa volta para casa. Quem não tem, chega até quem pode ajudar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!perfil && (
              <>
                <Link to="/cadastrar" className={botao.primario}>
                  <PawPrint aria-hidden="true" size={18} />
                  Cadastrar meu pet
                </Link>
                <Link to="/cadastrar?papel=ong" className={botao.secundario}>
                  <HandHeart aria-hidden="true" size={18} />
                  Sou de uma ONG
                </Link>
              </>
            )}
            <Link to="/mapa" className={botao.fantasma}>
              Ver o mapa
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-marca-700 p-8 text-marca-50 shadow-lg sm:p-10">
            <PawPrint
              aria-hidden="true"
              size={160}
              strokeWidth={1}
              className="absolute top-6 right-6 text-marca-600/70"
            />
            <p className="relative font-display text-2xl font-semibold text-white">
              Por que isso importa
            </p>
            <dl className="relative mt-6 grid grid-cols-3 gap-4">
              {NUMEROS.map((n) => (
                <div key={n.rotulo}>
                  <dt className="sr-only">{n.rotulo}</dt>
                  <dd className="font-display text-3xl font-semibold text-white sm:text-4xl">
                    {n.valor}
                  </dd>
                  <dd className="mt-1 text-sm text-marca-100">{n.rotulo}</dd>
                </div>
              ))}
            </dl>
            <p className="relative mt-8 border-t border-marca-500 pt-5 text-marca-50">
              O país já tem o cadastro nacional (SinPatinhas), mas ainda não há como ler o chip na
              rua. O DeVolta é essa ponte.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-3xl font-semibold sm:text-4xl">
          Como funciona
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => {
            const Icone = p.icone
            return (
              <li key={p.titulo} className={cartao}>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-100 text-marca-700">
                    <Icone aria-hidden="true" size={24} />
                  </span>
                  <span className="font-display text-3xl font-semibold text-marca-200">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="mt-4 font-display text-lg font-semibold">{p.titulo}</p>
                <p className="mt-2 text-stone-700">{p.texto}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="titulo-mapa">
        <h2 id="titulo-mapa" className="mb-6 text-3xl font-semibold sm:text-4xl">
          Avistamentos e animais procurados
        </h2>
        <PainelMapaPublico altura="h-96" />
      </section>
    </div>
  )
}
