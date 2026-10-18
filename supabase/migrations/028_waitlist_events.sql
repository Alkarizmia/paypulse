-- Événements anonymes de l'entonnoir liste d'attente.
-- INTERDIT : IP, user-agent, email, visitor id, cookie.
-- Accès uniquement via service role (API serveur). Aucune policy publique.

create table if not exists public.waitlist_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  location text null,
  source text null,
  lang text null,
  created_at timestamptz not null default now(),
  constraint waitlist_events_event_check check (
    event in (
      'cta_click',
      'modal_open',
      'email_focus',
      'signup_success',
      'signup_error'
    )
  ),
  constraint waitlist_events_location_check check (
    location is null
    or location in ('hero', 'calculateur', 'fin_de_page', 'menu')
  )
);

create index if not exists waitlist_events_created_at_idx
  on public.waitlist_events (created_at desc);

create index if not exists waitlist_events_event_created_at_idx
  on public.waitlist_events (event, created_at desc);

alter table public.waitlist_events enable row level security;

-- Pas de policy : anon / authenticated ne peuvent ni lire ni écrire.
-- Le service role (API serveur) contourne le RLS.

comment on table public.waitlist_events is
  'Entonnoir waitlist PayPulss (anonyme). Pas d''IP ni d''email.';
