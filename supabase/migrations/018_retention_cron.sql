-- 018_retention_cron.sql
-- Politique de rétention automatique pour limiter la croissance de la base sur le plan Free.
--
-- Ce qui est nettoyé chaque jour (03:00 UTC) :
--   • notifications : seulement celles déjà LUES depuis plus de 60 jours.
--     (les notifications non lues sont conservées indéfiniment)
--   • reminder_events : événements de plus de 365 jours (audit court terme — l'historique
--     "envoyé / échoué" reste accessible pendant un an dans l'onglet historique).
--
-- Ce qui N'EST PAS touché (intentionnel — obligation comptable ou métier critique) :
--   • billing_records, subscriptions, profiles, workspaces, clients, reminder_jobs,
--     reminder_rules, reminder_email_templates, account_*, auth.users.
--
-- Sécurité :
--   • Suppression en lots de 10 000 lignes pour ne pas verrouiller la table.
--   • Fonction SECURITY DEFINER avec search_path explicite (best practice Postgres).
--   • Si pg_cron n'est pas activable sur le projet, la fonction est créée mais la
--     planification est silencieusement ignorée (cf. blocs DO $$ … EXCEPTION).
--
-- Pour exécuter manuellement (ex. cron externe Vercel) :
--   select public.cleanup_old_data();

-- ---------------------------------------------------------------------------
-- 1) Fonction de nettoyage (toujours créée, ne dépend pas de pg_cron)
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_old_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  -- Notifications lues > 60 jours
  loop
    delete from public.notifications
    where id in (
      select id
      from public.notifications
      where read_at is not null
        and read_at < now() - interval '60 days'
      limit 10000
    );
    get diagnostics deleted_count = row_count;
    exit when deleted_count = 0;
  end loop;

  -- Reminder events > 365 jours
  loop
    delete from public.reminder_events
    where id in (
      select id
      from public.reminder_events
      where created_at < now() - interval '365 days'
      limit 10000
    );
    get diagnostics deleted_count = row_count;
    exit when deleted_count = 0;
  end loop;
end;
$$;

comment on function public.cleanup_old_data() is
  'Supprime par lots les notifications lues > 60 jours et les reminder_events > 365 jours. Planifiée via pg_cron (cf. migration 018).';

-- ROLLBACK: drop function if exists public.cleanup_old_data();

-- ---------------------------------------------------------------------------
-- 2) Activer pg_cron (best effort — peut nécessiter d'être activé manuellement
--    via Dashboard Supabase → Database → Extensions sur certains projets)
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron;
exception
  when others then
    raise notice 'pg_cron non activable automatiquement (%). Active-le via Dashboard → Database → Extensions, puis exécute :  select cron.schedule(''quota_retention_cleanup'', ''0 3 * * *'', ''select public.cleanup_old_data();'');', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Planifier la tâche quotidienne (idempotent — supprime puis recrée)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'quota_retention_cleanup') then
    perform cron.unschedule('quota_retention_cleanup');
  end if;
  perform cron.schedule(
    'quota_retention_cleanup',
    '0 3 * * *',
    'select public.cleanup_old_data();'
  );
exception
  when undefined_function or undefined_table or invalid_schema_name then
    raise notice 'pg_cron indisponible — la fonction public.cleanup_old_data() existe et peut être appelée par un scheduler externe (cron Vercel, GitHub Action…).';
end $$;

-- ROLLBACK: select cron.unschedule('quota_retention_cleanup');  -- (si pg_cron est dispo)
