-- Exécuter ce script dans Supabase → SQL Editor (une fois), puis vérifier RLS.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  email text not null,
  amount_due numeric(12, 2) not null default 0,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  created_at timestamptz not null default now()
);

alter table public.clients
  add column if not exists company_name text;

alter table public.clients
  add column if not exists paid_at timestamptz;

alter table public.clients
  add column if not exists deleted_at timestamptz;

alter table public.clients
  add column if not exists paid_events jsonb not null default '[]'::jsonb;

create index if not exists clients_due_date_idx on public.clients (due_date);
create index if not exists clients_status_idx on public.clients (status);

alter table public.clients enable row level security;

-- MVP : accès public avec la clé anon (à durcir avec auth utilisateur en production).
drop policy if exists "clients_anon_all" on public.clients;
create policy "clients_anon_all" on public.clients for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- SaaS settings/profile + subscriptions + billing (idempotent migration)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  address text,
  country text,
  language text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_language_check check (language in ('fr', 'en'))
);

alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists language text not null default 'fr';

alter table public.profiles
  add column if not exists auto_reminders_enabled boolean not null default true;

alter table public.profiles
  add column if not exists ui_theme text not null default 'dark';

alter table public.profiles
  drop constraint if exists profiles_ui_theme_check;

alter table public.profiles
  add constraint profiles_ui_theme_check check (ui_theme in ('dark', 'light', 'system'));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null default 'free' check (plan_id in ('free', 'starter', 'pro', 'agency')),
  status text not null default 'trial',
  amount_cents integer not null default 0,
  currency text not null default 'EUR',
  current_period_end timestamptz,
  stripe_subscription_id text,
  billing_interval text,
  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists billing_interval text;

alter table public.subscriptions
  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check
  check (billing_interval is null or billing_interval in ('month', 'year'));

create index if not exists subscriptions_user_created_idx on public.subscriptions (user_id, created_at desc);

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null default 'paid',
  paid_at timestamptz not null default now(),
  provider text not null default 'mock',
  stripe_checkout_session_id text
);

alter table public.billing_records
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists billing_records_stripe_checkout_session_key
  on public.billing_records (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists billing_records_user_paid_idx on public.billing_records (user_id, paid_at desc);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_records enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id and plan_id = 'free');

drop policy if exists "subscriptions_update_own" on public.subscriptions;

drop policy if exists "billing_select_own" on public.billing_records;
create policy "billing_select_own"
  on public.billing_records for select
  using (auth.uid() = user_id);

drop policy if exists "billing_insert_own" on public.billing_records;
create policy "billing_insert_own"
  on public.billing_records for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Workspaces (portefeuilles) + clients liés (voir aussi migrations/002_workspaces.sql)
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists clients_user_id_idx on public.clients (user_id);

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
