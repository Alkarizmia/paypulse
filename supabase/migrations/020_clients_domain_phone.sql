-- Domaine et téléphone optionnels sur les fiches clients
alter table public.clients
  add column if not exists domain text;

alter table public.clients
  add column if not exists phone text;
