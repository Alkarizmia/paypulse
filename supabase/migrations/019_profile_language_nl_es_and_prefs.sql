-- Langues profil : NL / ES + préférences produit (e-mails produit, liste compacte).

alter table public.profiles
  drop constraint if exists profiles_language_check;

alter table public.profiles
  add constraint profiles_language_check check (language in ('fr', 'en', 'nl', 'es'));

alter table public.profiles add column if not exists email_product_updates boolean not null default true;

alter table public.profiles add column if not exists invoice_list_compact boolean not null default false;
