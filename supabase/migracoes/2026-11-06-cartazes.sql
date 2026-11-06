-- Cartazes públicos de pets perdidos (aba /cartazes).
-- Rode este arquivo no SQL Editor do Supabase em bancos criados antes de 06/11/2026.
-- O schema.sql já contém estas mudanças para bancos novos. Pode rodar mais de uma vez.

alter table pets add column if not exists cartaz_publico boolean not null default false;
alter table pets add column if not exists cartaz_descricao text;
alter table pets add column if not exists perdido_desde timestamptz;
alter table pets add column if not exists encontrado_em timestamptz;

-- Marca as datas do cartaz sempre que o modo perdido muda, venha de onde vier
-- (interruptor do pet, botão "Ele está perdido" da notificação ou seed).
create or replace function public.datas_modo_perdido()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.modo_perdido then
      new.perdido_desde := coalesce(new.perdido_desde, now());
      new.encontrado_em := null;
    end if;
  elsif new.modo_perdido is distinct from old.modo_perdido then
    if new.modo_perdido then
      new.perdido_desde := now();
      new.encontrado_em := null;
    elsif old.perdido_desde is not null then
      new.encontrado_em := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ao_mudar_modo_perdido on pets;
create trigger ao_mudar_modo_perdido
  before insert or update of modo_perdido on pets
  for each row execute function public.datas_modo_perdido();

-- Pets que já estavam perdidos antes desta migração ganham a data de agora.
update pets set perdido_desde = coalesce(perdido_desde, criado_em) where modo_perdido;

create index if not exists idx_pets_cartaz on pets (cartaz_publico) where cartaz_publico;
