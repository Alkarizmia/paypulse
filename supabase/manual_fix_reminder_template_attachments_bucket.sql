-- À exécuter une fois dans Supabase → SQL Editor si l’upload affiche « Bucket not found ».
-- Crée le bucket Storage + colonnes sur reminder_email_templates + policies RLS.

-- 1) Colonnes sur les modèles (si pas déjà fait)
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

-- 2) Bucket Storage (50 Mo max par fichier au niveau bucket)
insert into storage.buckets (id, name, public, file_size_limit)
values ('reminder-template-attachments', 'reminder-template-attachments', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- 3) Policies : chaque utilisateur ne voit que son dossier (premier segment = auth.uid())
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
