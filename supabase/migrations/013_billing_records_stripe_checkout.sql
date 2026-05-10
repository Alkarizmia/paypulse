-- Idempotence des lignes de facturation créées depuis Stripe Checkout
alter table public.billing_records
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists billing_records_stripe_checkout_session_key
  on public.billing_records (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
