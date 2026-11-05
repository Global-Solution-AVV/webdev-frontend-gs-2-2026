-- DeVolta · schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase antes do seed.
-- O front-end NUNCA acessa estas tabelas direto: tudo passa pelas funções /api,
-- que usam a service role key. Por isso o RLS fica ligado e sem políticas para anon/authenticated.

create extension if not exists pgcrypto;

-- ---------- Perfis (1:1 com auth.users) ----------
create table if not exists perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  papel text not null check (papel in ('tutor', 'ong', 'coordenacao')),
  nome text not null,
  telefone text,               -- privado: só o próprio tutor vê
  criado_em timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra pelo Supabase Auth.
-- Só aceita 'tutor' ou 'ong' vindos do cadastro; 'coordenacao' é criada pelo seed.
create or replace function public.criar_perfil_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_papel text := coalesce(new.raw_user_meta_data ->> 'papel', 'tutor');
begin
  if v_papel not in ('tutor', 'ong') then
    v_papel := 'tutor';
  end if;
  insert into public.perfis (id, papel, nome, telefone)
  values (
    new.id,
    v_papel,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'telefone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ---------- Pets com microchip ----------
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references perfis (id) on delete cascade,
  nome text not null,
  especie text not null check (especie in ('gato', 'cachorro')),
  chip text not null unique check (chip ~ '^[0-9]{9,15}$'),
  foto_url text,
  modo_perdido boolean not null default false,
  ultimo_aviso_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ---------- Animais perdidos (sem chip) ----------
create table if not exists animais_perdidos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references perfis (id) on delete cascade,
  nome text not null,
  especie text not null check (especie in ('gato', 'cachorro')),
  descricao text,
  perdido_em date not null default current_date, -- quando o tutor percebeu que o animal sumiu
  foto_url text,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'ativo' check (status in ('ativo', 'encontrado')),
  criado_em timestamptz not null default now()
);

-- ---------- ONGs ----------
create table if not exists ongs (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references perfis (id) on delete cascade,
  nome text not null,
  contato_publico text,
  lat double precision not null,
  lng double precision not null,
  raio_km numeric(6, 2) not null check (raio_km > 0),
  vagas integer not null default 0 check (vagas >= 0),
  criado_em timestamptz not null default now()
);

-- ---------- Dispositivos (pontos de identificação) ----------
create table if not exists dispositivos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  local_nome text not null,
  lat double precision not null,
  lng double precision not null,
  estoque_g integer not null default 0 check (estoque_g >= 0),
  estoque_minimo_g integer not null default 500 check (estoque_minimo_g >= 0),
  limite_porcoes_dia integer not null default 10 check (limite_porcoes_dia >= 0),
  porcao_g integer not null default 20 check (porcao_g > 0),
  status text not null default 'ativo' check (status in ('ativo', 'manutencao', 'inativo')),
  api_key_hash text,
  criado_em timestamptz not null default now()
);

-- ---------- Detecções recebidas dos dispositivos ----------
create table if not exists deteccoes (
  id uuid primary key default gen_random_uuid(),
  dispositivo_id uuid not null references dispositivos (id) on delete cascade,
  categoria text not null,
  confidence numeric(4, 3) not null,
  chip text,
  resultado text not null check (resultado in ('descartada', 'tutor', 'avistamento')),
  motivo text,
  porcao_liberada boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------- Ocorrências de resgate ----------
create table if not exists ocorrencias (
  id uuid primary key default gen_random_uuid(),
  dispositivo_id uuid not null references dispositivos (id) on delete cascade,
  especie text not null check (especie in ('gato', 'cachorro')),
  status text not null default 'aberta'
    check (status in ('aberta', 'em_atendimento', 'resgatado', 'nao_encontrado', 'encaminhado_tutor')),
  ong_id uuid references ongs (id) on delete set null,
  reservada_em timestamptz,
  atualizada_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create table if not exists ocorrencia_historico (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references ocorrencias (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  ong_id uuid references ongs (id) on delete set null,
  perfil_id uuid references perfis (id) on delete set null, -- null = sistema
  observacao text,
  criado_em timestamptz not null default now()
);

-- ---------- Avistamentos (animal sem chip identificado) ----------
create table if not exists avistamentos (
  id uuid primary key default gen_random_uuid(),
  dispositivo_id uuid not null references dispositivos (id) on delete cascade,
  deteccao_id uuid references deteccoes (id) on delete set null,
  especie text not null check (especie in ('gato', 'cachorro')),
  foto_url text,
  lat double precision not null,
  lng double precision not null,
  ocorrencia_id uuid references ocorrencias (id) on delete set null,
  reconhecido_por_perdido_id uuid references animais_perdidos (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- ---------- Notificações ao tutor (SMS simulado) ----------
create table if not exists notificacoes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  tutor_id uuid not null references perfis (id) on delete cascade,
  dispositivo_id uuid references dispositivos (id) on delete set null,
  tipo text not null check (tipo in ('imediato', 'diario')),
  mensagem text not null,
  resposta text check (resposta in ('ok', 'perdido')),
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------- Índices ----------
create index if not exists idx_pets_tutor on pets (tutor_id);
create index if not exists idx_perdidos_tutor on animais_perdidos (tutor_id);
create index if not exists idx_perdidos_status on animais_perdidos (status);
create index if not exists idx_deteccoes_disp on deteccoes (dispositivo_id, criado_em desc);
create index if not exists idx_avist_disp on avistamentos (dispositivo_id, especie, criado_em desc);
create index if not exists idx_avist_data on avistamentos (criado_em desc);
create index if not exists idx_ocorr_status on ocorrencias (status);
create index if not exists idx_hist_ocorr on ocorrencia_historico (ocorrencia_id, criado_em);
create index if not exists idx_notif_tutor on notificacoes (tutor_id, criado_em desc);

-- ---------- RLS: ligado, sem políticas (acesso só via service role nas funções /api) ----------
alter table perfis enable row level security;
alter table pets enable row level security;
alter table animais_perdidos enable row level security;
alter table ongs enable row level security;
alter table dispositivos enable row level security;
alter table deteccoes enable row level security;
alter table ocorrencias enable row level security;
alter table ocorrencia_historico enable row level security;
alter table avistamentos enable row level security;
alter table notificacoes enable row level security;
