-- 017_perf_indexes.sql
-- Index manquants pour réduire la charge CPU/IO (et donc l'egress dérivé des Index Scan vs Seq Scan)
-- sur les requêtes les plus fréquentes du dashboard.
--
-- Toutes les commandes sont idempotentes (IF NOT EXISTS) → la migration peut être rejouée
-- sans erreur. CONCURRENTLY n'est pas utilisé pour rester cohérent avec les migrations
-- existantes du dépôt (002, 005, 009…) qui utilisent toutes des CREATE INDEX classiques.
-- Les tables visées sont petites sur le plan Free → verrou bref, sans impact réel.

-- ---------------------------------------------------------------------------
-- 1) clients : couvrir le pattern fréquent .eq(workspace_id).is(deleted_at, null)
--    (fetchClients) + l'inverse pour la corbeille (fetchTrashedClients).
--    L'index existant clients_workspace_id_idx (migration 002) reste, mais cet
--    index partiel est beaucoup plus petit et accélère le filtrage sur
--    deleted_at is null sans payer l'overhead des lignes supprimées.
-- ---------------------------------------------------------------------------
create index if not exists clients_workspace_active_idx
  on public.clients (workspace_id, created_at desc)
  where deleted_at is null;
-- ROLLBACK: drop index if exists public.clients_workspace_active_idx;

create index if not exists clients_workspace_trashed_idx
  on public.clients (workspace_id, deleted_at desc)
  where deleted_at is not null;
-- ROLLBACK: drop index if exists public.clients_workspace_trashed_idx;

-- ---------------------------------------------------------------------------
-- 2) clients : recherche par email dans un workspace
--    Utilisé par advanceClientToNextInvoiceCycle (count exact des cycles
--    d'un même e-mail) et par les jointures côté reminder-automation.
-- ---------------------------------------------------------------------------
create index if not exists clients_workspace_email_idx
  on public.clients (workspace_id, email)
  where deleted_at is null;
-- ROLLBACK: drop index if exists public.clients_workspace_email_idx;

-- ---------------------------------------------------------------------------
-- 3) subscriptions : getCurrentSubscription filtre par user_id et trie par
--    created_at desc. Aucun index sur user_id n'existait (seul l'unique
--    stripe_subscription_id de la migration 011 était présent).
-- ---------------------------------------------------------------------------
create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);
-- ROLLBACK: drop index if exists public.subscriptions_user_created_idx;

-- ---------------------------------------------------------------------------
-- 4) billing_records : getBillingRecords filtre par user_id et trie par
--    paid_at desc (limit 10). Aucun index user_id n'existait.
-- ---------------------------------------------------------------------------
create index if not exists billing_records_user_paid_idx
  on public.billing_records (user_id, paid_at desc);
-- ROLLBACK: drop index if exists public.billing_records_user_paid_idx;
