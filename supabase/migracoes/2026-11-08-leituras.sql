-- Leituras do sensor dos pontos de identificação (nível do silo, temperatura e umidade).
-- O estoque deixa de ser editado à mão: o nível vem só destas leituras (spec §6.4).
-- Rode este arquivo no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- O schema.sql já contém estas mudanças para bancos novos.

create table if not exists leituras_dispositivo (
  id uuid primary key default gen_random_uuid(),
  dispositivo_id uuid not null references dispositivos (id) on delete cascade,
  medido_em timestamptz not null default now(),
  nivel_silo_pct numeric(5, 1) check (nivel_silo_pct between 0 and 100),
  temperatura_c numeric(4, 1) check (temperatura_c between -40 and 80),
  umidade_pct numeric(4, 1) check (umidade_pct between 0 and 100),
  estado text,
  criado_em timestamptz not null default now()
);

create index if not exists leituras_dispositivo_recentes
  on leituras_dispositivo (dispositivo_id, medido_em desc);

-- Leitura mais recente de cada ponto (usada na lista de dispositivos).
create or replace view ultima_leitura_dispositivo with (security_invoker = true) as
select distinct on (dispositivo_id) *
from leituras_dispositivo
order by dispositivo_id, medido_em desc;

-- Mesmo padrão das outras tabelas: RLS ligado, sem políticas; só a API (service role) acessa.
alter table leituras_dispositivo enable row level security;
revoke all on ultima_leitura_dispositivo from anon, authenticated;

-- As colunas antigas de estoque (estoque_g, estoque_minimo_g, porcao_g) não são mais usadas.
-- Elas ficam no banco até a versão nova estar publicada na Vercel (a versão antiga ainda as lê).
-- Depois do deploy, se quiser removê-las, rode:
--   alter table dispositivos drop column if exists estoque_g,
--     drop column if exists estoque_minimo_g, drop column if exists porcao_g;
