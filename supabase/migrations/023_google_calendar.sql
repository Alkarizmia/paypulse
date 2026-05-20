-- Connexion Google Calendar par utilisateur (tokens chiffrés côté app, accès serveur via service role).

create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_encrypted text not null,
  calendar_id text not null default 'primary',
  sync_enabled boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.google_calendar_event_map (
  user_id uuid not null references auth.users (id) on delete cascade,
  paypulss_event_id text not null,
  google_event_id text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, paypulss_event_id)
);

create index if not exists google_calendar_event_map_user_idx
  on public.google_calendar_event_map (user_id);

alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_event_map enable row level security;

-- Pas de policy SELECT/INSERT pour les utilisateurs : refresh_token via service role uniquement.
-- Les clients utilisent les routes API /api/integrations/google-calendar/* pour l'état et les actions.

drop policy if exists "google_calendar_event_map_select_own" on public.google_calendar_event_map;
create policy "google_calendar_event_map_select_own"
  on public.google_calendar_event_map for select
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
