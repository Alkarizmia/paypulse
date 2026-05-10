-- Stripe (test ou prod) — exécuter dans Supabase → SQL Editor.
-- Idempotent : réexécuter ne casse rien. Le webhook utilise la service role (bypass RLS).

-- ---------------------------------------------------------------------------
-- Table subscriptions (si ton projet date d’avant ce schéma)
-- ---------------------------------------------------------------------------
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

-- Colonne Stripe (migration 011) si la table existait sans cette colonne
alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

alter table public.subscriptions
  add column if not exists billing_interval text;

alter table public.subscriptions
  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check
  check (billing_interval is null or billing_interval in ('month', 'year'));

create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- RLS : lecture / écriture côté client (JWT utilisateur). Service role = pas RLS.
-- ---------------------------------------------------------------------------
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
