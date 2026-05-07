-- Anti-duplication des alertes "impayé dépassé" (notif + e-mail)
-- Une ligne par client / jour / destinataire / canal.

create table if not exists public.overdue_alert_dispatches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  alert_day date not null,
  channel text not null check (channel in ('in_app', 'email')),
  created_at timestamptz not null default now(),
  unique (client_id, recipient_user_id, alert_day, channel)
);

create index if not exists overdue_alert_dispatches_workspace_day_idx
  on public.overdue_alert_dispatches (workspace_id, alert_day desc);

alter table public.overdue_alert_dispatches enable row level security;

-- Table purement serveur (service role) : aucun accès côté client.
drop policy if exists "overdue_alert_dispatches_no_client_select" on public.overdue_alert_dispatches;
create policy "overdue_alert_dispatches_no_client_select"
  on public.overdue_alert_dispatches for select
  using (false);

drop policy if exists "overdue_alert_dispatches_no_client_insert" on public.overdue_alert_dispatches;
create policy "overdue_alert_dispatches_no_client_insert"
  on public.overdue_alert_dispatches for insert
  with check (false);

drop policy if exists "overdue_alert_dispatches_no_client_update" on public.overdue_alert_dispatches;
create policy "overdue_alert_dispatches_no_client_update"
  on public.overdue_alert_dispatches for update
  using (false)
  with check (false);

drop policy if exists "overdue_alert_dispatches_no_client_delete" on public.overdue_alert_dispatches;
create policy "overdue_alert_dispatches_no_client_delete"
  on public.overdue_alert_dispatches for delete
  using (false);
