-- Devise d’affichage et de saisie (EUR ou USD avec conversion indicative).

alter table public.profiles
  add column if not exists display_currency text not null default 'EUR';

alter table public.profiles
  drop constraint if exists profiles_display_currency_check;

alter table public.profiles
  add constraint profiles_display_currency_check check (display_currency in ('EUR', 'USD'));
