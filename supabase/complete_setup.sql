-- =============================================================================
-- PayPulss — schéma SQL complet (idempotent)
-- Ordre : schema.sql puis migrations 002 → 008
-- =============================================================================

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
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_created_idx on public.subscriptions (user_id, created_at desc);

create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null default 'paid',
  paid_at timestamptz not null default now(),
  provider text not null default 'mock'
);

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
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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


-- Équipe Agency : invitations par e-mail + membres (admin / membre)
-- Exécuter dans Supabase SQL Editor après 002_workspaces.sql

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.account_invites (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists account_invites_owner_email_pending_idx
  on public.account_invites (owner_user_id, lower(trim(email)))
  where status = 'pending';

create index if not exists account_invites_token_idx on public.account_invites (token);

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (owner_user_id, member_user_id)
);

create index if not exists account_members_member_idx on public.account_members (member_user_id);

alter table public.account_invites enable row level security;
alter table public.account_members enable row level security;

-- ---------------------------------------------------------------------------
-- RLS account_invites
-- ---------------------------------------------------------------------------

drop policy if exists "invites_select_owner" on public.account_invites;
create policy "invites_select_owner"
  on public.account_invites for select
  using (auth.uid() = owner_user_id);

drop policy if exists "invites_insert_owner" on public.account_invites;
create policy "invites_insert_owner"
  on public.account_invites for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "invites_update_owner" on public.account_invites;
create policy "invites_update_owner"
  on public.account_invites for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "invites_delete_owner" on public.account_invites;
create policy "invites_delete_owner"
  on public.account_invites for delete
  using (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------------
-- RLS account_members
-- ---------------------------------------------------------------------------

drop policy if exists "members_select" on public.account_members;
create policy "members_select"
  on public.account_members for select
  using (auth.uid() = owner_user_id or auth.uid() = member_user_id);

drop policy if exists "members_insert_owner" on public.account_members;
create policy "members_insert_owner"
  on public.account_members for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "members_delete_owner" on public.account_members;
create policy "members_delete_owner"
  on public.account_members for delete
  using (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------------
-- Helper : lien membre → propriétaire du compte partagé
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Remplacer politiques workspaces (propriétaire + membres en lecture)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Remplacer politiques clients (membre = lecture ; admin + owner = écriture)
-- ---------------------------------------------------------------------------

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

-- Mise à jour : propriétaire, admin invité, ou membre invité (ex. marquer payé)
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
-- RPC : accepter une invitation (e-mail du compte connecté = e-mail invité)
-- ---------------------------------------------------------------------------

create or replace function public.accept_account_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inv public.account_invites%rowtype;
  me uuid := auth.uid();
  my_email text;
begin
  if me is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select email into my_email from auth.users where id = me;
  if my_email is null then
    return json_build_object('ok', false, 'error', 'no_email');
  end if;

  select * into inv
  from public.account_invites
  where token = p_token and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'error', 'invalid_or_used');
  end if;

  if lower(trim(inv.email)) <> lower(trim(my_email)) then
    return json_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  if inv.owner_user_id = me then
    return json_build_object('ok', false, 'error', 'cannot_join_self');
  end if;

  insert into public.account_members (owner_user_id, member_user_id, role)
  values (inv.owner_user_id, me, inv.role)
  on conflict (owner_user_id, member_user_id) do update
    set role = excluded.role;

  update public.account_invites
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.accept_account_invite(uuid) from public;
grant execute on function public.accept_account_invite(uuid) to authenticated;


-- Historique des encaissements reconnus (facturation récurrente : flèche « mois suivant »)
alter table public.clients
  add column if not exists paid_events jsonb not null default '[]'::jsonb;

comment on column public.clients.paid_events is 'Liste JSON [{ "at": "ISO", "amount": number }] — encaissements passés pour graphiques / bilan même si statut repasse à impayé.';

-- Rétro-remplir depuis paid_at pour les lignes déjà payées
update public.clients c
set paid_events = jsonb_build_array(
  jsonb_build_object(
    'at', coalesce(c.paid_at::text, c.created_at::text, now()::text),
    'amount', c.amount_due::float8
  )
)
where c.status = 'paid'
  and c.paid_at is not null
  and (c.paid_events is null or c.paid_events = '[]'::jsonb);


-- Reminder automation (jobs + events + rules)

create table if not exists public.reminder_rules (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  timezone text not null default 'Europe/Paris',
  days_after_due integer[] not null default array[3, 7, 21],
  max_jobs_per_run integer not null default 50 check (max_jobs_per_run > 0 and max_jobs_per_run <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  schedule_days integer not null,
  due_date date not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped', 'cancelled')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text not null unique,
  subject text,
  last_error text,
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminder_jobs_status_scheduled_idx
  on public.reminder_jobs (status, scheduled_for asc);
create index if not exists reminder_jobs_workspace_idx
  on public.reminder_jobs (workspace_id, created_at desc);
create index if not exists reminder_jobs_client_idx
  on public.reminder_jobs (client_id, created_at desc);

create table if not exists public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.reminder_jobs (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  event_type text not null
    check (event_type in ('queued', 'processing', 'sent', 'failed', 'skipped_paid', 'skipped_not_due', 'retry_scheduled')),
  client_email text,
  subject text,
  error_message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reminder_events_owner_created_idx
  on public.reminder_events (owner_user_id, created_at desc);
create index if not exists reminder_events_job_idx
  on public.reminder_events (job_id, created_at asc);

alter table public.reminder_rules enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.reminder_events enable row level security;

drop policy if exists "reminder_rules_select_owner" on public.reminder_rules;
create policy "reminder_rules_select_owner"
  on public.reminder_rules for select
  using (auth.uid() = owner_user_id);

drop policy if exists "reminder_rules_insert_owner" on public.reminder_rules;
create policy "reminder_rules_insert_owner"
  on public.reminder_rules for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_rules_update_owner" on public.reminder_rules;
create policy "reminder_rules_update_owner"
  on public.reminder_rules for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_jobs_select_owner" on public.reminder_jobs;
create policy "reminder_jobs_select_owner"
  on public.reminder_jobs for select
  using (auth.uid() = owner_user_id);

drop policy if exists "reminder_events_select_owner" on public.reminder_events;
create policy "reminder_events_select_owner"
  on public.reminder_events for select
  using (auth.uid() = owner_user_id);


-- Modèles d'e-mail persistés (relances auto + contenu), + préférence thème UI.

-- Thème dashboard / app shell (dark, light, ou suit le système)
alter table public.profiles
  add column if not exists ui_theme text not null default 'dark';

alter table public.profiles
  drop constraint if exists profiles_ui_theme_check;

alter table public.profiles
  add constraint profiles_ui_theme_check check (ui_theme in ('dark', 'light', 'system'));

-- Un modèle par délai J+n par portefeuille (contenu mail + lien paiement optionnel)
create table if not exists public.reminder_email_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  days_after_due integer not null check (days_after_due >= 0 and days_after_due <= 120),
  subject_template text not null,
  body_template text not null,
  payment_link text,
  sort_order integer not null default 0,
  status_scope text not null default 'unpaid'
    check (status_scope in ('unpaid', 'paid', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, days_after_due)
);

create index if not exists reminder_email_templates_workspace_idx
  on public.reminder_email_templates (workspace_id, sort_order asc);

alter table public.reminder_email_templates enable row level security;

drop policy if exists "reminder_email_templates_select" on public.reminder_email_templates;
create policy "reminder_email_templates_select"
  on public.reminder_email_templates for select
  using (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_insert" on public.reminder_email_templates;
create policy "reminder_email_templates_insert"
  on public.reminder_email_templates for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_update" on public.reminder_email_templates;
create policy "reminder_email_templates_update"
  on public.reminder_email_templates for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_delete" on public.reminder_email_templates;
create policy "reminder_email_templates_delete"
  on public.reminder_email_templates for delete
  using (auth.uid() = owner_user_id);

-- Rétro-remplissage : une ligne par jour déjà configuré dans reminder_rules
insert into public.reminder_email_templates (
  workspace_id,
  owner_user_id,
  days_after_due,
  subject_template,
  body_template,
  payment_link,
  sort_order,
  status_scope
)
select
  rr.workspace_id,
  rr.owner_user_id,
  x.day,
  'Rappel J+' || x.day || ' — facture en attente ({{clientName}})',
  'Bonjour,' || chr(10) || chr(10)
    || 'Petit rappel concernant la facture de {{amount}} € échue le {{dueDate}}.' || chr(10)
    || 'Relance programmée automatiquement à J+' || x.day || '.' || chr(10)
    || 'Merci de nous confirmer la date de règlement.' || chr(10) || chr(10)
    || 'Cordialement,' || chr(10)
    || 'PayPulss',
  null,
  x.ord::integer,
  'unpaid'
from public.reminder_rules rr
cross join lateral unnest(rr.days_after_due) with ordinality as x(day, ord)
on conflict (workspace_id, days_after_due) do nothing;

-- Les modèles de relance ne ciblent plus qu’un statut : uniquement factures impayées (produit + UI).

alter table public.reminder_email_templates
  drop column if exists status_scope;

-- Événement d’audit quand une fiche client est ignorée (même e-mail + même créneau qu’une autre fiche).

alter table public.reminder_events
  drop constraint if exists reminder_events_event_type_check;

alter table public.reminder_events
  add constraint reminder_events_event_type_check
  check (
    event_type in (
      'queued',
      'processing',
      'sent',
      'failed',
      'skipped_paid',
      'skipped_not_due',
      'retry_scheduled',
      'skipped_duplicate_email'
    )
  );
