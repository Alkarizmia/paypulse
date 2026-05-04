-- Les modèles de relance ne ciblent plus qu’un statut : uniquement factures impayées (produit + UI).

alter table public.reminder_email_templates
  drop column if exists status_scope;
