-- Liste d'attente (emails au lancement). Accès uniquement via service role (API /api/waitlist).
-- Si la table existait déjà sans source/langue, appliquer aussi 026_waitlist_source_langue.sql.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  source text,
  langue text
);

create unique index if not exists waitlist_email_lower_unique
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- Pas de policy : anon / authenticated ne peuvent ni lire ni écrire.
-- Le service role (API serveur) contourne le RLS.

comment on table public.waitlist is 'Emails liste d''attente PayPulss (lancement). Pas d''envoi auto.';
