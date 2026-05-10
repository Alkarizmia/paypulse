-- Intervalle de facturation Stripe (month / year) pour l’affichage (ex. 374 €/an vs /mois)
alter table public.subscriptions
  add column if not exists billing_interval text;

alter table public.subscriptions
  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check
  check (billing_interval is null or billing_interval in ('month', 'year'));
