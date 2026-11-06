# DeVolta

> Pontos de identificação que devolvem o animal perdido ao tutor e levam o animal abandonado até quem pode resgatá-lo.

Global Solution 2026.2 · FIAP · CitizenTech · Engenharia de Software 1º ano
Aplicação web das disciplinas **Front-end Design** e **Web Development**.

## Ficha da CitizenTech

| Campo                      | Resposta                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome da CitizenTech**    | DeVolta                                                                                                                                                                                                                                                                                                                                  |
| **Cidade e bairro**        | São Paulo · _[bairro a definir pela equipe]_                                                                                                                                                                                                                                                                                             |
| **Cidadão beneficiado**    | Tutores que perderam o pet, ONGs de resgate e a população que convive com animais nas ruas                                                                                                                                                                                                                                               |
| **Problema, em uma frase** | O microchip do pet só é lido de muito perto e não há como ler na rua, então animais perdidos não voltam para casa e animais abandonados não chegam a quem pode resgatá-los.                                                                                                                                                              |
| **Como funciona**          | Pontos de identificação reconhecem gato ou cachorro, liberam uma pequena porção (a isca) e leem o microchip enquanto o animal come. Com chip, o tutor é avisado com local e horário. Sem chip, vira avistamento; se o animal volta ao mesmo ponto por 3 dias e ninguém o reconhece, abre uma ocorrência para as ONGs da região com vaga. |
| **O que cada parte faz**   | **Web/Front-end (este repositório):** plataforma para tutores, ONGs, público e coordenação · **Python:** central de decisões com JSON · **Edge (ESP32/Wokwi):** o ponto de identificação · **Matemática:** porção mínima, área de busca e melhor horário de resgate · **UX:** requisitos e jornada · **Pitch:** história e negócio       |
| **Link do repositório**    | https://github.com/Global-Solution-AVV/webdev-frontend-gs-2-2026                                                                                                                                                                                                                                                                         |
| **Indicador de impacto**   | _[a definir pela equipe]_                                                                                                                                                                                                                                                                                                                |
| **ODS conectados**         | 3 (saúde e zoonoses), 11 (cidades sustentáveis), 15 (vida terrestre), 17 (parcerias)                                                                                                                                                                                                                                                     |

**Deploy:** _[link da Vercel após o deploy]_

## Funcionalidades

| Perfil                  | O que faz                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Público** (sem login) | Mapa de avistamentos e animais perdidos, com filtro por período, espécie e raio ("perto de mim"), e mural de **cartazes** de pets com chip (procurando / encontrados)                                                                                 |
| **Tutor**               | CRUD de pets com microchip, modo perdido, cartaz público opcional (expõe o telefone), avisos (SMS simulado) com os botões "Está tudo bem" / "Ele está perdido", CRUD de animais perdidos sem chip e comparação com avistamentos próximos ("É o meu!") |
| **ONG**                 | Cadastro da área de atuação e das vagas, painel de ocorrências (só as do raio e com vaga), assumir resgate, atualizar status, histórico e o **padrão de horários** ("aparece entre 21h e 23h")                                                        |
| **Coordenação**         | CRUD dos pontos de identificação, estoque de ração com alerta, chave de API por ponto, **simulador de detecção** e visão de todas as ocorrências                                                                                                      |

Regras de negócio principais: máximo de 1 aviso por dia por pet (exceto em modo perdido), avistamento só vira resgate depois de **N = 3 dias** de recorrência, reserva da ONG expira em **X = 24 h** sem atualização, e o telefone do tutor só aparece no cartaz público, se ele autorizar, e só enquanto o pet está perdido.

## Stack

- **React 19 + Vite** (JavaScript) · **Tailwind CSS v4** · **React Router**
- **React Leaflet + OpenStreetMap** para os mapas
- **API própria em Vercel Functions** (`/api`) + **Supabase** (Postgres e Auth) via `supabase-js`
- **ESLint**, **Prettier** e **Vitest**
- Deploy na **Vercel**

### Arquitetura

```
Navegador ──(login)──► Supabase Auth
    │
    └──(fetch + token)──► /api (Vercel Functions) ──(service role)──► Supabase Postgres
                              ▲
ESP32 / script Python ──(X-Device-Key)──┘  POST /api/deteccoes
```

O front-end **não** acessa o banco direto: o RLS está ligado sem políticas, e todas as permissões são verificadas nas funções `/api`.

### Organização das pastas

```
api/                 Backend (uma função por recurso)
  _lib/              Infra compartilhada (não vira rota)
    regras/          Regras de negócio puras + testes (Vitest)
supabase/schema.sql  Tabelas, índices, gatilhos e RLS
supabase/migracoes/  Alterações para bancos já criados
scripts/seed.js      Dados fictícios de demonstração
src/
  services/          Acesso a dados (fetch para a API)
  hooks/             Custom hooks (estado + lógica de negócio da tela)
  components/        Componentes visuais reutilizáveis
  pages/             Páginas ligadas às rotas
  context/           Sessão de login
  lib/               Formatação, estilos e cliente do Supabase Auth
```

Separação de responsabilidades: **componentes não chamam `fetch`**. Páginas usam hooks; hooks usam services.

**Custom hooks:** `useOcorrencias`, `useOcorrencia`, `useAvistamentos`, `usePets`, `useAnimaisPerdidos`, `useDispositivos`, `useNotificacoes`, `useMinhaOng`, `useOngs`, `useAuth`, `useFormulario`, `useRequisicao`.

**Componentes:** `Header`, `Footer`, `RotaProtegida`, `Mapa`, `LegendaMapa`, `SeletorLocal`, `PainelMapaPublico`, `CardPet`, `CardAnimalPerdido`, `CardOcorrencia`, `BadgeStatus`, `TimelineHistorico`, `ListaNotificacoes`, `FotoAnimal`, `FormPet`, `FormAnimalPerdido`, `FormOng`, `FormDispositivo`, `Campo`, `Modal`, `ConfirmDialog`, `Alerta`, `Carregando`, `EstadoVazio`.

## Pré-requisitos

- Node.js 20 ou mais novo (testado com 22) e npm
- Conta gratuita no [Supabase](https://supabase.com)
- [Vercel CLI](https://vercel.com/docs/cli) para rodar a API localmente: `npm i -g vercel`

## Instalação e execução

1. **Instale as dependências**
   ```bash
   npm install
   ```
2. **Crie o banco**: no Supabase, abra o _SQL Editor_ e rode o arquivo `supabase/schema.sql` inteiro. Banco criado antes de 06/11/2026? Rode também `supabase/migracoes/2026-11-06-cartazes.sql`.
3. **Configure as variáveis**: copie `.env.example` para `.env` e preencha com os dados do projeto Supabase (_Project Settings → API_).

   | Variável                                      | Uso                                                               |
   | --------------------------------------------- | ----------------------------------------------------------------- |
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Login no navegador                                                |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`   | Funções `/api` (nunca use o prefixo `VITE_` na service role)      |
   | `CONFIDENCE_MINIMA`                           | Confiança mínima para aceitar a detecção (0 a 1). Usamos **0.75** |
   | `RAIO_COMPARACAO_PERDIDOS_KM`                 | Raio dos avistamentos próximos a um animal perdido. Usamos **3**  |

4. **Popule com dados fictícios** (opcional, recomendado para a demonstração):

   ```bash
   npm run seed
   ```

   Contas criadas (senha `devolta123`, todas `@devolta.demo`): `coordenacao`; tutores `ana.tutora`, `bruno.tutor`, `carla.tutora`, `diego.tutor`, `elisa.tutora`; ONGs `patas`, `abrigo` (sem vagas), `resgate.sul`, `miados`, `lar.leste`.

   O seed cria 12 pontos (DV-001 a DV-012, chave `dv_demo_<código>`), cada um com leituras de chip (avisos aos tutores) e avistamentos sem chip, 30 tutores (os 5 acima e mais 25 extras, `tutor06` a `tutor30@devolta.demo`, mesma senha), 50 pets com chip (10 perdidos com cartaz público e 7 encontrados), 3 animais perdidos sem chip e 7 ocorrências cobrindo todos os status, inclusive uma reserva vencida. Para ver uma ocorrência nascer, simule um cachorro sem chip no DV-003.

5. **Rode front-end + API juntos**:
   ```bash
   npm run dev:full
   ```
   `npm run dev` sobe só o front (sem a API).

### Scripts

| Comando            | O que faz                             |
| ------------------ | ------------------------------------- |
| `npm run dev:full` | Front + API (`vercel dev`)            |
| `npm run dev`      | Só o front-end (Vite)                 |
| `npm run build`    | Build de produção                     |
| `npm run lint`     | ESLint                                |
| `npm run format`   | Prettier                              |
| `npm test`         | Testes das regras de negócio (Vitest) |
| `npm run seed`     | Dados fictícios no Supabase           |

## API

Todas as rotas respondem JSON. Erros vêm como `{ "erro": "mensagem" }`. Rotas com login usam `Authorization: Bearer <token do Supabase>`.

| Recurso             | Rotas                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/me`           | `GET` · `POST` · `PUT` · `DELETE`                                                                                                        |
| `/api/pets`         | `GET` · `GET ?cartazes=1` (público) · `GET /:id` · `POST` · `PUT /:id` · `PATCH /:id/modo-perdido` · `PATCH /:id/cartaz` · `DELETE /:id` |
| `/api/perdidos`     | `GET` (público) · `GET ?meus=1` · `GET /:id` · `GET /:id/avistamentos-proximos` · `POST` · `PUT /:id` · `DELETE /:id`                    |
| `/api/ongs`         | `GET` (público) · `GET ?minha=1` · `POST` · `PUT /:id` · `DELETE /:id`                                                                   |
| `/api/dispositivos` | `GET` · `POST` · `PUT /:id` · `POST /:id/repor` · `POST /:id/chave` · `DELETE /:id`                                                      |
| `/api/deteccoes`    | `POST` (ingestão) · `GET`                                                                                                                |
| `/api/avistamentos` | `GET ?lat&lng&raio_km&desde&ate&especie` · `PATCH /:id/reconhecer`                                                                       |
| `/api/ocorrencias`  | `GET` · `GET /:id` · `POST /:id/assumir` · `PATCH /:id/status` · `DELETE /:id`                                                           |
| `/api/notificacoes` | `GET` · `PATCH /:id/resposta` · `PATCH /:id/lida` · `DELETE /:id`                                                                        |

### Enviar detecções do ESP32 ou do Python

Mesmo formato do `deteccoes.json` da disciplina de Python:

```bash
curl -X POST https://SEU-DEPLOY.vercel.app/api/deteccoes \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: dv_demo_DV-001" \
  -d '{"ponto":"DV-001","categoria":"gato","confidence":0.93,"chip":"981020000000001"}'
```

Resposta: `{ "resultado": "tutor" | "avistamento" | "descartada", "motivo": "...", "liberar_porcao": true }`.
As chaves `dv_demo_*` existem só nos dados de demonstração; gere chaves reais na tela **Pontos → Chave**.

## Deploy na Vercel

1. Importe o repositório na Vercel (o preset **Vite** é detectado).
2. Em _Settings → Environment Variables_, cadastre as variáveis do `.env`.
3. Faça o deploy. O `vercel.json` já mapeia `/api/:recurso/:id` e o fallback da SPA.

## Privacidade (LGPD)

- A imagem é analisada no próprio dispositivo; só chega `categoria` e `confidence`. A foto da plataforma é só um link de imagem do animal.
- O telefone do tutor nunca sai da API, a não ser para o próprio tutor.
- Todos os dados de demonstração são fictícios.

## Integrantes

| Nome            | RM              |
| --------------- | --------------- |
| _[a preencher]_ | _[a preencher]_ |

## Uso de IA

Veja [AI.md](AI.md).
