-- Corrige users_phone_key : ne pas écrire auth.users.phone si un autre compte a déjà ce E.164.
-- À appliquer si la migration 015 a été exécutée avec l’ancienne fonction (erreur 23505).

create or replace function public.sync_auth_user_from_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r public.profiles%rowtype;
  normalized_phone text;
  e164 text;
  can_set_auth_phone boolean;
begin
  select * into strict r from public.profiles where user_id = p_user_id;

  normalized_phone := regexp_replace(coalesce(r.phone, ''), '[\s.\-/]', '', 'g');

  if normalized_phone ~ '^\+[1-9][0-9]{7,14}$' then
    e164 := normalized_phone;
  elsif normalized_phone ~ '^0[1-9][0-9]{7,8}$' then
    e164 := '+32' || substring(normalized_phone from 2);
  else
    e164 := null;
  end if;

  can_set_auth_phone :=
    e164 is null
    or not exists (
      select 1
      from auth.users o
      where o.phone = e164
        and o.id <> p_user_id
    );

  update auth.users u
  set
    raw_user_meta_data =
      coalesce(u.raw_user_meta_data, '{}'::jsonb)
      || jsonb_strip_nulls(
        jsonb_build_object(
          'full_name', nullif(trim(coalesce(r.full_name, '')), ''),
          'display_name', nullif(trim(coalesce(r.full_name, '')), ''),
          'name', nullif(trim(coalesce(r.full_name, '')), ''),
          'company_name', nullif(trim(coalesce(r.company_name, '')), ''),
          'contact_phone', nullif(trim(coalesce(r.phone, '')), ''),
          'address', nullif(trim(coalesce(r.address, '')), ''),
          'country', nullif(trim(coalesce(r.country, '')), '')
        )
      ),
    phone = case
      when can_set_auth_phone and e164 is not null then e164
      else u.phone
    end,
    phone_confirmed_at = case
      when can_set_auth_phone and e164 is not null then coalesce(u.phone_confirmed_at, now())
      else u.phone_confirmed_at
    end
  where u.id = p_user_id;
end;
$$;

comment on function public.sync_auth_user_from_profile(uuid) is
  'Copie nom/adresse/téléphone depuis public.profiles vers auth.users. Phone Auth seulement si E.164 libre (unicité users_phone_key).';

revoke all on function public.sync_auth_user_from_profile(uuid) from public;
