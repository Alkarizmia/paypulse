-- Colonne Stripe pour relier les webhooks aux lignes d'abonnement
alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

create unique index if not exists subscriptions_stripe_subscription_id_key
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;
