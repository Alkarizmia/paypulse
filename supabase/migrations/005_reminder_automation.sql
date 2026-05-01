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
