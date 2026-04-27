-- Équipe Agency : invitations par e-mail + membres (admin / membre)
-- Exécuter dans Supabase SQL Editor après 002_workspaces.sql

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.account_invites (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists account_invites_owner_email_pending_idx
  on public.account_invites (owner_user_id, lower(trim(email)))
  where status = 'pending';

create index if not exists account_invites_token_idx on public.account_invites (token);

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (owner_user_id, member_user_id)
);

create index if not exists account_members_member_idx on public.account_members (member_user_id);

alter table public.account_invites enable row level security;
alter table public.account_members enable row level security;

-- ---------------------------------------------------------------------------
-- RLS account_invites
-- ---------------------------------------------------------------------------

drop policy if exists "invites_select_owner" on public.account_invites;
create policy "invites_select_owner"
  on public.account_invites for select
  using (auth.uid() = owner_user_id);

drop policy if exists "invites_insert_owner" on public.account_invites;
create policy "invites_insert_owner"
  on public.account_invites for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "invites_update_owner" on public.account_invites;
create policy "invites_update_owner"
  on public.account_invites for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "invites_delete_owner" on public.account_invites;
create policy "invites_delete_owner"
  on public.account_invites for delete
  using (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------------
-- RLS account_members
-- ---------------------------------------------------------------------------

drop policy if exists "members_select" on public.account_members;
create policy "members_select"
  on public.account_members for select
  using (auth.uid() = owner_user_id or auth.uid() = member_user_id);

drop policy if exists "members_insert_owner" on public.account_members;
create policy "members_insert_owner"
  on public.account_members for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "members_delete_owner" on public.account_members;
create policy "members_delete_owner"
  on public.account_members for delete
  using (auth.uid() = owner_user_id);

-- ---------------------------------------------------------------------------
-- Helper : lien membre → propriétaire du compte partagé
-- ---------------------------------------------------------------------------

create or replace function public.is_account_admin_for_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner = auth.uid()
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = p_owner
        and m.member_user_id = auth.uid()
        and m.role = 'admin'
    );
$$;

create or replace function public.is_account_member_for_owner(p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_owner = auth.uid()
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = p_owner
        and m.member_user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Remplacer politiques workspaces (propriétaire + membres en lecture)
-- ---------------------------------------------------------------------------

drop policy if exists "workspaces_select_own" on public.workspaces;
drop policy if exists "workspaces_select_owner_or_member" on public.workspaces;
create policy "workspaces_select_owner_or_member"
  on public.workspaces for select
  using (public.is_account_member_for_owner(user_id));

drop policy if exists "workspaces_insert_own" on public.workspaces;
create policy "workspaces_insert_own"
  on public.workspaces for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = user_id
        and m.member_user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "workspaces_update_own" on public.workspaces;
create policy "workspaces_update_own"
  on public.workspaces for update
  using (public.is_account_admin_for_owner(user_id))
  with check (public.is_account_admin_for_owner(user_id));

drop policy if exists "workspaces_delete_own" on public.workspaces;
create policy "workspaces_delete_own"
  on public.workspaces for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Remplacer politiques clients (membre = lecture ; admin + owner = écriture)
-- ---------------------------------------------------------------------------

drop policy if exists "clients_select_own_ws" on public.clients;
create policy "clients_select_own_ws"
  on public.clients for select
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  );

drop policy if exists "clients_insert_own_ws" on public.clients;
create policy "clients_insert_own_ws"
  on public.clients for insert
  with check (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_admin_for_owner(w.user_id)
    )
  );

-- Mise à jour : propriétaire, admin invité, ou membre invité (ex. marquer payé)
drop policy if exists "clients_update_own_ws" on public.clients;
create policy "clients_update_own_ws"
  on public.clients for update
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  )
  with check (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_member_for_owner(w.user_id)
    )
  );

drop policy if exists "clients_delete_own_ws" on public.clients;
create policy "clients_delete_own_ws"
  on public.clients for delete
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_admin_for_owner(w.user_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RPC : accepter une invitation (e-mail du compte connecté = e-mail invité)
-- ---------------------------------------------------------------------------

create or replace function public.accept_account_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inv public.account_invites%rowtype;
  me uuid := auth.uid();
  my_email text;
begin
  if me is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select email into my_email from auth.users where id = me;
  if my_email is null then
    return json_build_object('ok', false, 'error', 'no_email');
  end if;

  select * into inv
  from public.account_invites
  where token = p_token and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'error', 'invalid_or_used');
  end if;

  if lower(trim(inv.email)) <> lower(trim(my_email)) then
    return json_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  if inv.owner_user_id = me then
    return json_build_object('ok', false, 'error', 'cannot_join_self');
  end if;

  insert into public.account_members (owner_user_id, member_user_id, role)
  values (inv.owner_user_id, me, inv.role)
  on conflict (owner_user_id, member_user_id) do update
    set role = excluded.role;

  update public.account_invites
  set status = 'accepted', accepted_at = now()
  where id = inv.id;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.accept_account_invite(uuid) from public;
grant execute on function public.accept_account_invite(uuid) to authenticated;
