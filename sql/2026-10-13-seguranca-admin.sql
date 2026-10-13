-- Segurança do painel admin: login por e-mail (Supabase Auth) + regras de acesso (RLS)
-- Rodar inteiro no SQL Editor do Supabase. Pode ser executado mais de uma vez.

-- ── 1. Lista de administradores ──────────────────────────────────────────────
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- sem políticas: só acessível pelas funções abaixo

insert into public.admins (email) values
  ('thelma@mentoriahedra.com.br'),
  ('thelmatalvares@gmail.com'),
  ('jonasbcastro@gmail.com')
on conflict do nothing;

create or replace function public.e_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── 2. Remove todas as regras antigas das tabelas do inventário ─────────────
-- (as regras se somam; uma regra permissiva esquecida deixaria tudo aberto)
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('respostas', 'acessos', 'configuracoes')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.respostas     enable row level security;
alter table public.acessos       enable row level security;
alter table public.configuracoes enable row level security;

-- ── 3. Respostas: o público só grava; só administradores leem, editam e excluem
create policy "publico grava respostas" on public.respostas
  for insert to anon, authenticated with check (true);
create policy "admin le respostas" on public.respostas
  for select to authenticated using (public.e_admin());
create policy "admin edita respostas" on public.respostas
  for update to authenticated using (public.e_admin()) with check (public.e_admin());
create policy "admin exclui respostas" on public.respostas
  for delete to authenticated using (public.e_admin());

-- ── 4. Acessos (testes liberados): só administradores ───────────────────────
create policy "admin gerencia acessos" on public.acessos
  for all to authenticated using (public.e_admin()) with check (public.e_admin());

-- ── 5. Configurações: público lê o termo LGPD; só administradores editam ────
create policy "publico le termo lgpd" on public.configuracoes
  for select to anon, authenticated using (chave like 'lgpd\_%' or public.e_admin());
create policy "admin insere configuracoes" on public.configuracoes
  for insert to authenticated with check (public.e_admin());
create policy "admin edita configuracoes" on public.configuracoes
  for update to authenticated using (public.e_admin()) with check (public.e_admin());

-- ── 6. Funções usadas pelo inventário público ────────────────────────────────
-- Devolvem só o necessário para aquele e-mail, sem abrir a tabela inteira.

create or replace function public.resultado_anterior(p_email text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'nome', nome, 'empresa', empresa, 'cargo', cargo,
    'autodominio', autodominio, 'direcao', direcao, 'influencia', influencia, 'maestria', maestria,
    'eixo_x', eixo_x, 'eixo_y', eixo_y, 'perfil', perfil, 'created_at', created_at
  )
  from public.respostas
  where lower(email) = lower(trim(p_email))
  order by created_at desc
  limit 1;
$$;

create or replace function public.slots_disponiveis(p_email text)
returns integer
language sql stable security definer set search_path = public
as $$
  select coalesce((select slots from public.acessos where lower(email) = lower(trim(p_email)) limit 1), 0);
$$;

create or replace function public.consumir_slot(p_email text)
returns void
language sql security definer set search_path = public
as $$
  update public.acessos set slots = slots - 1
  where lower(email) = lower(trim(p_email)) and slots > 0;
$$;

revoke all on function public.e_admin(), public.resultado_anterior(text),
  public.slots_disponiveis(text), public.consumir_slot(text) from public;
-- anon também precisa: a regra de leitura do termo chama e_admin() (retorna false para o público)
grant execute on function public.e_admin() to anon, authenticated;
grant execute on function public.resultado_anterior(text), public.slots_disponiveis(text),
  public.consumir_slot(text) to anon, authenticated;
