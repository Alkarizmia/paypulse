-- Complète waitlist si créée sans source/langue (schéma partiel).

alter table public.waitlist
  add column if not exists source text;

alter table public.waitlist
  add column if not exists langue text;
