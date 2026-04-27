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
