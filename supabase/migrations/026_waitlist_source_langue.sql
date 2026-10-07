-- Ancienne migration obsolète : la table prod n'a pas source/langue.
-- Conservée pour l'historique des fichiers ; no-op sûr.

-- provider sert de trace CTA+langue (ex. landing-nav:fr) côté /api/waitlist.
select 1;
