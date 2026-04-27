-- Portefeuilles (workspaces) Agency + isolation clients par workspace_id
-- Exécuter après schema.sql de base (Supabase → SQL Editor).

-- Propriétaire des lignes clients (si colonne absente)
alter table public.clients
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists clients_user_id_idx on public.clients (user_id);

-- Portefeuilles
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_user_sort_idx on public.workspaces (user_id, sort_order asc);

alter table public.clients
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

create index if not exists clients_workspace_id_idx on public.clients (workspace_id);

-- Profil : dernier portefeuille actif
alter table public.profiles
  add column if not exists active_workspace_id uuid references public.workspaces (id) on delete set null;

alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_own" on public.workspaces;
create policy "workspaces_select_own"
  on public.workspaces for select
  using (auth.uid() = user_id);

drop policy if exists "workspaces_insert_own" on public.workspaces;
create policy "workspaces_insert_own"
  on public.workspaces for insert
  with check (auth.uid() = user_id);

drop policy if exists "workspaces_update_own" on public.workspaces;
create policy "workspaces_update_own"
  on public.workspaces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workspaces_delete_own" on public.workspaces;
create policy "workspaces_delete_own"
  on public.workspaces for delete
  using (auth.uid() = user_id);

-- RLS clients : uniquement les lignes dont le workspace appartient à l’utilisateur
drop policy if exists "clients_anon_all" on public.clients;
drop policy if exists "clients_select_own_ws" on public.clients;
drop policy if exists "clients_insert_own_ws" on public.clients;
drop policy if exists "clients_update_own_ws" on public.clients;
drop policy if exists "clients_delete_own_ws" on public.clients;

create policy "clients_select_own_ws"
  on public.clients for select
  using (
    workspace_id is not null
    and exists (select 1 from public.workspaces w where w.id = clients.workspace_id and w.user_id = auth.uid())
  );

create policy "clients_insert_own_ws"
  on public.clients for insert
  with check (
    workspace_id is not null
    and exists (select 1 from public.workspaces w where w.id = clients.workspace_id and w.user_id = auth.uid())
  );

create policy "clients_update_own_ws"
  on public.clients for update
  using (
    workspace_id is not null
    and exists (select 1 from public.workspaces w where w.id = clients.workspace_id and w.user_id = auth.uid())
  )
  with check (
    workspace_id is not null
    and exists (select 1 from public.workspaces w where w.id = clients.workspace_id and w.user_id = auth.uid())
  );

create policy "clients_delete_own_ws"
  on public.clients for delete
  using (
    workspace_id is not null
    and exists (select 1 from public.workspaces w where w.id = clients.workspace_id and w.user_id = auth.uid())
  );

-- Backfill : un portefeuille « Principal » par utilisateur ayant des clients sans workspace
insert into public.workspaces (user_id, name, sort_order)
select distinct c.user_id, 'Principal', 0
from public.clients c
where c.user_id is not null
  and c.workspace_id is null
  and not exists (
    select 1 from public.workspaces w where w.user_id = c.user_id
  );

update public.clients c
set workspace_id = (
  select w.id
  from public.workspaces w
  where w.user_id = c.user_id
  order by w.sort_order asc, w.created_at asc
  limit 1
)
where c.workspace_id is null
  and c.user_id is not null;

-- Utilisateurs sans clients : rien à faire ici (l’app crée le 1er workspace à la volée)
