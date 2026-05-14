-- ============================================================================
-- PayPulss — SQL manuel Supabase (Authentication → Users)
--
-- Dans le SQL Editor : COLLE TOUT CE FICHIER puis clique RUN une seule fois.
-- Ne lance PAS uniquement le bloc DO en bas : la fonction n’existerait pas encore.
-- ============================================================================

-- Sync public.profiles → auth.users (raw_user_meta_data + phone E.164)
--
-- Objectif : remplir le tableau « Authentication → Users » (Display name, Phone)
-- à partir des lignes déjà présentes dans public.profiles, puis à chaque mise à jour.
--
-- Avertissements :
-- 1) La méthode recommandée reste l’API GoTrue (service_role + admin.updateUserById),
--    déjà implémentée dans l’app (POST /api/sync-auth-profile).
-- 2) Ce SQL modifie auth.users : exécute-le en tant que rôle avec droits sur auth
--    (SQL Editor Supabase = postgres, ou migration `supabase db push`).
-- 3) La colonne auth.users.phone est UNIQUE : on ne l’écrit que si l’E.164 n’est pas déjà
--    utilisé par un autre utilisateur (sinon seules les métadonnées changent, contact_phone inclus).

-- ---------------------------------------------------------------------------
-- Fonction : applique une ligne profiles vers auth.users
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Trigger : après insert/update des champs profil
-- ---------------------------------------------------------------------------
create or replace function public.profiles_sync_to_auth_users()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.sync_auth_user_from_profile(new.user_id);
  return new;
end;
$$;

revoke all on function public.profiles_sync_to_auth_users() from public;

drop trigger if exists profiles_sync_to_auth_users on public.profiles;

create trigger profiles_sync_to_auth_users
after insert or update of full_name, company_name, phone, address, country
on public.profiles
for each row
execute procedure public.profiles_sync_to_auth_users();

-- ---------------------------------------------------------------------------
-- Rattrapage : tous les profils existants (nécessite la fonction ci-dessus)
-- ---------------------------------------------------------------------------
do $$
declare
  uid uuid;
begin
  for uid in select user_id from public.profiles
  loop
    perform public.sync_auth_user_from_profile(uid);
  end loop;
end $$;
