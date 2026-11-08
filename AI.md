# Uso de Inteligência Artificial

Este arquivo documenta como a equipe usou IA no desenvolvimento da plataforma DeVolta, entregue nas disciplinas de **Front-end Design** e **Web Development**.

Resumo: a IA foi usada como copiloto de **desenvolvimento guiado por especificação** (_spec-driven development_). Primeiro escrevemos, junto com a IA, uma especificação com requisitos claros, regras de negócio, casos de uso e casos de teste. Só depois a IA gerou o código, seguindo a spec. A IA também foi usada para escrever o script de **seed** que popula o banco com dados fictícios de demonstração.

## 1. Ferramentas utilizadas

| Ferramenta                                      | Finalidade                                                                                                                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code** (Anthropic, modelo Claude Opus) | Ler o briefing da GS e o documento de concepção, levantar as decisões em aberto, escrever a especificação (requisitos, regras, casos de uso e testes), gerar o código da API, do banco e do front-end, os testes e o seed do banco |

Nenhuma outra ferramenta de IA foi usada neste repositório.

## 2. Processo: desenvolvimento guiado por especificação

Seguimos quatro etapas, sempre nesta ordem:

1. **Contexto**: a IA leu o briefing da GS (desafio CitizenTech da FIAP) e o documento de concepção do DeVolta escrito pela equipe.
2. **Perguntas antes de supor**: a IA listou tudo o que estava em aberto e a equipe decidiu cada ponto.
3. **Especificação**: a IA escreveu a especificação do projeto, que a equipe revisou. Ela contém:
   - **checklist dos requisitos obrigatórios** das duas disciplinas, item por item, com a parte da spec que atende cada um;
   - **requisitos funcionais por perfil** (público, tutor, ONG, coordenação);
   - **15 regras de negócio** numeradas, com parâmetros fixos (N = 3 dias, X = 24 h, confiança mínima 0.75, raio de 3 km);
   - **casos de uso** de cada ator;
   - **casos de teste** das regras de negócio;
   - modelo de dados, rotas da API, rotas do front, componentes e hooks previstos, plano de commits e o que fica fora do escopo.
4. **Implementação em etapas**: a IA gerou o código seguindo a spec, e a equipe validou cada etapa antes de fazer o commit.

### Casos de uso definidos na spec

| Ator              | Casos de uso                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Público**       | Ver o mapa de avistamentos e animais perdidos, filtrar por período, espécie e raio ("perto de mim"), ver o mural de cartazes (procurando / encontrados)                       |
| **Tutor**         | Cadastrar, editar e excluir pets com chip; ligar o modo perdido; publicar o cartaz; responder aos avisos; cadastrar perdidos sem chip; reconhecer um avistamento ("É o meu!") |
| **ONG**           | Cadastrar a área de atuação e as vagas, ver as ocorrências do seu raio, assumir um resgate, atualizar o status e ver o padrão de horários                                     |
| **Coordenação**   | Gerenciar os pontos de identificação, repor o estoque, gerar a chave de API, simular detecções e acompanhar todas as ocorrências                                              |
| **Ponto (ESP32)** | Enviar a detecção (`POST /api/deteccoes`) e receber se deve liberar a porção                                                                                                  |

### Casos de teste definidos na spec

Cada regra de negócio virou uma função pura em `api/_lib/regras/`, com testes em Vitest escritos a partir da spec (29 testes em 3 arquivos):

- **Detecção** (`deteccao.test.js`): aceita gato ou cachorro com confiança suficiente; descarta outras categorias e confiança baixa ou inválida; exige que a confiança mínima esteja configurada; só libera a porção com dispositivo ativo, estoque e abaixo do limite do dia; modo perdido sempre avisa na hora; sem modo perdido, no máximo um aviso por dia, contado pelo dia de São Paulo e não pelo UTC; alerta de estoque baixo.
- **Ocorrências** (`ocorrencias.test.js`): transições de status permitidas e bloqueadas; reserva expira depois de 24 h e não antes; recorrência em dias distintos, ignorando avistamentos já reconhecidos; ONG só vê o que está no raio e com vaga; distância por haversine; janela de 2 h com mais aparições, inclusive na virada da meia-noite.
- **Cartazes** (`cartazes.test.js`): só aparece com autorização do tutor; situação "perdido" e "encontrado"; mostra telefone e primeiro nome só enquanto está perdido; nunca expõe chip nem id do tutor.

## 3. Interações realizadas (exemplos representativos)

### 3.1 Contexto e decisões

**Prompt (resumo):** "Leia os 2 arquivos de referência [o briefing da GS e o documento de concepção do DeVolta]. Seu trabalho é criar a parte de webdev e front-end. A stack será Vite, Tailwind, deploy na Vercel rodando o backend e o banco. Se alguma parte da stack estiver em aberto, me pergunte; não suponha nada."

**Resposta:** a IA leu os dois documentos e perguntou sobre cada ponto em aberto. As decisões da equipe foram: banco Supabase; backend em funções `/api` no mesmo repositório; JavaScript; login real com Supabase Auth; acesso ao banco com supabase-js; mapa com React Leaflet + OpenStreetMap; fotos só por URL; React Router; fetch + custom hooks; npm; integração com ESP32/Python por endpoint e simulador; N = 3 dias e X = 24 h; expiração checada na leitura; interface só com Tailwind; ESLint, Prettier e Vitest.

### 3.2 Especificação

**Prompt (resumo):** "Com essas decisões, escreva a spec: requisitos obrigatórios das duas disciplinas, funcionalidades por perfil, regras de negócio, casos de uso, casos de teste, modelo de dados, API e plano de commits."

**Resposta:** a IA gerou a spec. Ela apontou o limite de 12 funções do plano gratuito da Vercel, o que levou à organização "uma função por recurso", e deixou sem valor fixo os parâmetros que dependiam das outras disciplinas (confiança mínima e raio), listando-os como pendências. A equipe definiu depois 0.75 e 3 km.

### 3.3 Implementação

**Prompt:** "Pode começar a implementar seguindo a spec. Nada é commitado sem eu validar."

**Resposta:** a IA gerou o projeto em etapas: configuração, schema SQL, regras de negócio com testes, API, services, custom hooks, componentes e páginas. Ao fim de cada etapa, ela propunha a mensagem de commit e esperava a aprovação.

### 3.4 Nova funcionalidade: cartazes públicos

**Prompt (resumo):** "Quero uma aba pública de animais perdidos, com filtro de encontrados. O tutor escolhe se publica o cartaz com o telefone."

**Resposta:** a IA atualizou primeiro a spec (regras 14 e 15: consentimento do tutor e dados que nunca aparecem no cartaz), depois escreveu os testes de `cartazes.js` e só então gerou a migração do banco, o endpoint e as telas.

### 3.5 Seed do banco

**Prompt (resumo):** "Escreva o seed do banco com dados fictícios para a demonstração, cobrindo todos os casos da spec. Depois amplie para 30 tutores e 50 pets, com perdidos e encontrados."

**Resposta:** a IA escreveu `scripts/seed.js`, que apaga e recria os dados de demonstração pelo supabase-js: 12 pontos de identificação (DV-001 a DV-012), 30 tutores, 50 pets com chip (10 perdidos com cartaz e 7 encontrados), 5 ONGs, leituras com chip, avistamentos sem chip e 7 ocorrências. O seed cobre de propósito os cenários da spec: ocorrências em todos os status, uma reserva vencida, um ponto a um dia de abrir ocorrência, estoque baixo, ponto em manutenção, ONG sem vagas, leituras descartadas e um chip sem cadastro. Todos os nomes, telefones e e-mails são fictícios (`@devolta.demo`), como pede a regra "Dados com cuidado" da GS.

### 3.6 Painel ao vivo dos pontos (MQTT)

**Prompt (resumo):** "O professor de Edge exige um back-end IoT Cloud com MQTT broker. Esses dados podem aparecer na aba /coordenacao, onde a coordenação já vê o estoque de cada dispositivo. Integre direto nessa página."

**Resposta:** a IA atualizou primeiro as specs de Edge (§7.5, contrato dos tópicos) e da plataforma (§6.3), depois escreveu as funções puras de `src/lib/telemetria.js` com testes, o service `mqttService.js`, o hook `usePontosAoVivo` e os componentes `PainelAoVivo` e `ResumoAoVivo`. A validação incluiu um teste de ida e volta pelo broker público: uma mensagem publicada por TCP (como o ESP32) chegou ao assinante por WebSocket (como o navegador) e foi interpretada pela mesma função da página.

### 3.7 Estoque pela leitura do sensor

**Prompt (resumo):** "Quero remover o nível de estoque editável do dispositivo: o nível deve vir apenas da leitura. O dispositivo continua ativo, mas mostrando a data da última medição. Simule o envio para os outros dispositivos, para que tenham histórico."

**Resposta:** a IA atualizou as specs (§6.4 e regras 2 e 13), criou a tabela `leituras_dispositivo` com uma migração só aditiva (o banco é o mesmo do site publicado, então as colunas antigas ficam até o deploy), o endpoint `POST /api/leituras` com validação em função pura e testes, a coluna de última medição, o histórico por ponto e o script `scripts/simular-leituras.js`, que envia o histórico pela mesma API do ESP32.

## 4. Aplicação no projeto

| Parte                                          | Papel da IA                                                            | Papel da equipe                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Especificação                                  | Escreveu a partir do briefing e das respostas da equipe                | Tomou todas as decisões de stack e de negócio, revisou e aprovou           |
| `supabase/schema.sql` e migração               | Gerou tabelas, índices, gatilhos e RLS                                 | Rodou no Supabase e conferiu as tabelas                                    |
| `api/_lib/regras/` e testes                    | Gerou as regras puras e os testes a partir da spec                     | Conferiu cada teste com a regra correspondente                             |
| `api/` (endpoints)                             | Gerou as funções por recurso, autenticação e validação                 | Testou as rotas com e sem login                                            |
| `src/` (services, hooks, componentes, páginas) | Gerou seguindo a separação services → hooks → páginas                  | Testou os fluxos no navegador e pediu ajustes de interface                 |
| `scripts/seed.js`                              | Escreveu e depois ampliou o volume de dados                            | Definiu os cenários de demonstração e conferiu os dados no banco e na tela |
| `README.md`                                    | Escreveu a Ficha da CitizenTech, as instruções e a documentação da API | Definiu o indicador de impacto e os ODS                                    |

## 5. Validação das respostas

- **Testes automatizados**: `npm test` roda os 29 testes das regras de negócio, todos passando.
- **Qualidade**: `npm run lint` e `npm run build` sem erros.
- **API**: conferimos que as rotas respondem 401 sem login e 405 para métodos não permitidos, e que as rotas públicas (`/api/ongs`, `/api/pets?cartazes=1`) retornam só os campos permitidos.
- **Banco e seed**: rodamos o seed no Supabase e conferimos os dados nas tabelas e nas telas de cada perfil, usando as contas de demonstração.
- **Deploy**: testamos a aplicação publicada em https://devolta-avv.vercel.app.
- **Commits**: nenhum código foi commitado sem a revisão da equipe. Quando algo não estava de acordo com a spec, pedimos a correção antes do commit (por exemplo, mostrar os e-mails completos das contas de demonstração na tela de login).

## 6. Análise crítica

**Benefícios**

- Começar pela spec obrigou a equipe a decidir antes de programar. A IA não conseguiu "inventar" a stack ou as regras: ela perguntou, e as respostas viraram requisitos escritos.
- Com requisitos, casos de uso e casos de teste definidos antes, ficou fácil conferir se o código fazia o que devia: cada regra tem um teste com o mesmo nome.
- Ganhamos muita velocidade na estrutura repetitiva (CRUD, services, hooks, formulários) e no seed, que levaria horas para escrever à mão com todos os cenários.

**Limitações**

- A IA não conhece o contexto da equipe nem das outras disciplinas. Valores como a confiança mínima e o raio de busca precisaram ser combinados com as entregas de Python e Edge.
- A IA gera muito código de uma vez. Isso exige que todos os integrantes revisem e entendam cada parte, já que todos precisam saber explicar o projeto inteiro.
- Os testes cobrem as regras de negócio, mas não as telas. Os fluxos visuais foram testados manualmente.

**Dificuldades**

- Manter a spec atualizada quando surgiram funcionalidades novas (como os cartazes). Adotamos a regra de atualizar a spec primeiro e só depois o código.
- Revisar entregas grandes em pouco tempo, dentro do prazo da GS.
