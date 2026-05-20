-- =============================================================================
-- PayPulss — correctif complet « Impossible de charger les clients »
-- À exécuter une fois dans Supabase → SQL Editor (projet paypulss / production).
-- Idempotent : relancer le script ne casse rien.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Table clients : colonnes attendues par l’app (fetchClients / insertClient)
-- ---------------------------------------------------------------------------

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  amount_due numeric(12, 2) not null default 0,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  created_at timestamptz not null default now()
);

alter table public.clients add column if not exists company_name text;
alter table public.clients add column if not exists domain text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists paid_at timestamptz;
alter table public.clients add column if not exists deleted_at timestamptz;
alter table public.clients add column if not exists paid_events jsonb;
alter table public.clients add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.clients add column if not exists workspace_id uuid;

-- paid_events : défaut + lignes existantes
update public.clients set paid_events = '[]'::jsonb where paid_events is null;
alter table public.clients alter column paid_events set default '[]'::jsonb;
do $$
begin
  alter table public.clients alter column paid_events set not null;
exception
  when others then null;
end $$;

create index if not exists clients_due_date_idx on public.clients (due_date);
create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_workspace_id_idx on public.clients (workspace_id);
create index if not exists clients_workspace_active_idx
  on public.clients (workspace_id, created_at desc)
  where deleted_at is null;
create index if not exists clients_workspace_trashed_idx
  on public.clients (workspace_id, deleted_at desc)
  where deleted_at is not null;
create index if not exists clients_workspace_email_idx
  on public.clients (workspace_id, email);

-- ---------------------------------------------------------------------------
-- 2) Portefeuilles (workspaces) + profil
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_user_sort_idx on public.workspaces (user_id, sort_order asc);

alter table public.clients
  drop constraint if exists clients_workspace_id_fkey;

alter table public.clients
  add constraint clients_workspace_id_fkey
  foreign key (workspace_id) references public.workspaces (id) on delete cascade;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  address text,
  country text,
  language text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists active_workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.profiles add column if not exists auto_reminders_enabled boolean not null default true;
alter table public.profiles add column if not exists email_product_updates boolean not null default true;
alter table public.profiles add column if not exists invoice_list_compact boolean not null default false;
alter table public.profiles add column if not exists ui_theme text not null default 'dark';

-- Un portefeuille « Principal » par utilisateur Auth sans portefeuille
insert into public.workspaces (user_id, name, sort_order)
select u.id, 'Principal', 0
from auth.users u
where not exists (
  select 1 from public.workspaces w where w.user_id = u.id
);

-- Clients sans workspace : rattacher au 1er portefeuille du propriétaire
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

-- user_id manquant sur une ligne qui a déjà un workspace
update public.clients c
set user_id = w.user_id
from public.workspaces w
where c.workspace_id = w.id
  and c.user_id is null;

-- Profil : portefeuille actif par défaut
insert into public.profiles (user_id, language)
select u.id, 'fr'
from auth.users u
where not exists (select 1 from public.profiles p where p.user_id = u.id)
on conflict (user_id) do nothing;

update public.profiles p
set active_workspace_id = (
  select w.id
  from public.workspaces w
  where w.user_id = p.user_id
  order by w.sort_order asc, w.created_at asc
  limit 1
)
where p.active_workspace_id is null
  and exists (select 1 from public.workspaces w where w.user_id = p.user_id);

-- ---------------------------------------------------------------------------
-- 3) Équipe Agency (optionnel) — fonctions utilisées par les politiques RLS
-- ---------------------------------------------------------------------------

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (owner_user_id, member_user_id)
);

create or replace function public.is_account_admin_for_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner = auth.uid()
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = p_owner
        and m.member_user_id = auth.uid()
        and m.role = 'admin'
    );
$$;

create or replace function public.is_account_member_for_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner = auth.uid()
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = p_owner
        and m.member_user_id = auth.uid()
    );
$$;

grant execute on function public.is_account_admin_for_owner(uuid) to authenticated, anon;
grant execute on function public.is_account_member_for_owner(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4) RLS workspaces + clients (propriétaire + membres invités)
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.clients enable row level security;

drop policy if exists "clients_anon_all" on public.clients;
drop policy if exists "workspaces_select_own" on public.workspaces;
drop policy if exists "workspaces_select_owner_or_member" on public.workspaces;

create policy "workspaces_select_owner_or_member"
  on public.workspaces for select
  using (public.is_account_member_for_owner(user_id));

drop policy if exists "workspaces_insert_own" on public.workspaces;
create policy "workspaces_insert_own"
  on public.workspaces for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = user_id
        and m.member_user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "workspaces_update_own" on public.workspaces;
create policy "workspaces_update_own"
  on public.workspaces for update
  using (public.is_account_admin_for_owner(user_id))
  with check (public.is_account_admin_for_owner(user_id));

drop policy if exists "workspaces_delete_own" on public.workspaces;
create policy "workspaces_delete_own"
  on public.workspaces for delete
  using (auth.uid() = user_id);

drop policy if exists "clients_select_own_ws" on public.clients;
create policy "clients_select_own_ws"
  on public.clients for select
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  );

drop policy if exists "clients_insert_own_ws" on public.clients;
create policy "clients_insert_own_ws"
  on public.clients for insert
  with check (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_admin_for_owner(w.user_id)
    )
  );

drop policy if exists "clients_update_own_ws" on public.clients;
create policy "clients_update_own_ws"
  on public.clients for update
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  )
  with check (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  );

drop policy if exists "clients_delete_own_ws" on public.clients;
create policy "clients_delete_own_ws"
  on public.clients for delete
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_admin_for_owner(w.user_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Recharger le cache API Supabase (colonnes domain / phone / paid_events)
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Vérification rapide (résultat dans l’onglet Results)
-- ---------------------------------------------------------------------------

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clients'
  and column_name in (
    'company_name',
    'domain',
    'phone',
    'paid_at',
    'deleted_at',
    'paid_events',
    'user_id',
    'workspace_id'
  )
order by column_name;

select count(*) as workspaces_count from public.workspaces;
select count(*) as clients_sans_workspace from public.clients where workspace_id is null;
