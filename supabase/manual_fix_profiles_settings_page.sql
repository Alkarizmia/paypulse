-- =============================================================================
-- Fix « Impossible de charger les paramètres » (page /settings)
-- =============================================================================
-- À exécuter dans Supabase → SQL Editor (une fois), en tant que postgres / rôle admin.
--
-- Cause fréquente : l’app fait un SELECT sur public.profiles avec les colonnes
--   email_product_updates, invoice_list_compact
-- et une contrainte language ('fr','en','nl','es').
-- Si la base n’a pas encore la migration 019, PostgREST renvoie une erreur → échec du chargement.
--
-- Ce script est idempotent : vous pouvez le relancer sans risque majeur.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Table profiles (si elle n’existe pas du tout)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2) Colonnes attendues par l’app (lib/profile.ts → getProfile / upsertProfile)
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists language text not null default 'fr';

alter table public.profiles
  add column if not exists auto_reminders_enabled boolean not null default true;

alter table public.profiles
  add column if not exists email_product_updates boolean not null default true;

alter table public.profiles
  add column if not exists invoice_list_compact boolean not null default false;

alter table public.profiles
  add column if not exists ui_theme text not null default 'dark';

alter table public.profiles
  add column if not exists display_currency text not null default 'EUR';

alter table public.profiles
  drop constraint if exists profiles_display_currency_check;

alter table public.profiles
  add constraint profiles_display_currency_check check (display_currency in ('EUR', 'USD'));

-- active_workspace_id : FK seulement si la table workspaces existe (évite erreur sur vieux projets)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'workspaces'
  ) then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'active_workspace_id'
    ) then
      execute
        'alter table public.profiles add column active_workspace_id uuid references public.workspaces (id) on delete set null';
    end if;
  else
    execute 'alter table public.profiles add column if not exists active_workspace_id uuid';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3) Valeurs language invalides → éviter l’échec du CHECK
-- -----------------------------------------------------------------------------
update public.profiles
set language = 'fr'
where language is null
   or btrim(language) = ''
   or lower(language) not in ('fr', 'en', 'nl', 'es');

-- -----------------------------------------------------------------------------
-- 4) Contrainte language : fr, en, nl, es
-- -----------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_language_check;

alter table public.profiles
  add constraint profiles_language_check
  check (language in ('fr', 'en', 'nl', 'es'));

-- -----------------------------------------------------------------------------
-- 5) Contrainte ui_theme
-- -----------------------------------------------------------------------------
update public.profiles
set ui_theme = 'dark'
where ui_theme is null
   or ui_theme not in ('dark', 'light', 'system');

alter table public.profiles
  drop constraint if exists profiles_ui_theme_check;

alter table public.profiles
  add constraint profiles_ui_theme_check
  check (ui_theme in ('dark', 'light', 'system'));

-- -----------------------------------------------------------------------------
-- 6) RLS policies (si la table venait d’être créée ou sans policies)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

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

-- -----------------------------------------------------------------------------
-- 7) Tables subscriptions + billing_records (chargées en parallèle sur /settings)
-- -----------------------------------------------------------------------------
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

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id and plan_id = 'free');

drop policy if exists "subscriptions_update_own" on public.subscriptions;

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

alter table public.billing_records enable row level security;

drop policy if exists "billing_select_own" on public.billing_records;
create policy "billing_select_own"
  on public.billing_records for select
  using (auth.uid() = user_id);

drop policy if exists "billing_insert_own" on public.billing_records;
create policy "billing_insert_own"
  on public.billing_records for insert
  with check (auth.uid() = user_id);

commit;

-- =============================================================================
-- Après exécution : recharger la page Paramètres (F5).
-- Si l’erreur persiste, ouvrir la console réseau → requête REST « profiles »
-- et vérifier subscriptions / billing_records (autres tables chargées au même moment).
-- =============================================================================
