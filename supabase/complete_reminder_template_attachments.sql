-- =============================================================================
-- PayPulss : pièces jointes des modèles de relance (PDF / images)
-- À exécuter UNE FOIS dans Supabase → SQL Editor (projet de prod ou dev).
-- Corrige : Bucket not found, Invalid key (espaces / apostrophes dans les noms),
-- colonnes manquantes, policies Storage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Colonnes sur reminder_email_templates
-- -----------------------------------------------------------------------------
alter table public.reminder_email_templates
  add column if not exists attachment_storage_path text,
  add column if not exists attachment_file_name text,
  add column if not exists attachment_content_type text,
  add column if not exists attachment_size_bytes integer;

alter table public.reminder_email_templates
  drop constraint if exists reminder_email_templates_attachment_size_check;

alter table public.reminder_email_templates
  add constraint reminder_email_templates_attachment_size_check
  check (attachment_size_bytes is null or attachment_size_bytes > 0);

comment on column public.reminder_email_templates.attachment_storage_path is
  'Chemin Storage (ASCII uniquement). Nom affiché dans attachment_file_name.';

comment on column public.reminder_email_templates.attachment_file_name is
  'Nom original du fichier pour le destinataire (peut contenir espaces et accents).';

-- -----------------------------------------------------------------------------
-- 2) Bucket Storage (privé, plafond technique 50 Mo par fichier)
-- Les limites métier par plan (1 / 10 / 50 Mo) sont appliquées par l’app.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reminder-template-attachments',
  'reminder-template-attachments',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = false;

-- -----------------------------------------------------------------------------
-- 3) Policies RLS sur storage.objects
-- Structure des clés : {user_id}/{workspace_id}/{jours}/{uuid}-nom-securise.ext
-- -----------------------------------------------------------------------------
drop policy if exists "reminder_attachments_select_own" on storage.objects;
create policy "reminder_attachments_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'reminder-template-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "reminder_attachments_insert_own" on storage.objects;
create policy "reminder_attachments_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'reminder-template-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "reminder_attachments_update_own" on storage.objects;
create policy "reminder_attachments_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'reminder-template-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'reminder-template-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "reminder_attachments_delete_own" on storage.objects;
create policy "reminder_attachments_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'reminder-template-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 4) Vérification (optionnel : doit retourner 1 ligne)
-- -----------------------------------------------------------------------------
-- select id, name, public, file_size_limit from storage.buckets
-- where id = 'reminder-template-attachments';
