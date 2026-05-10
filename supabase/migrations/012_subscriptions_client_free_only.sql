-- Les plans payants ne doivent pas être insérables avec le JWT utilisateur (contournement Checkout).
-- Le webhook Stripe utilise la service role (bypass RLS). Le client ne peut créer que plan free.

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id and plan_id = 'free');

drop policy if exists "subscriptions_update_own" on public.subscriptions;
