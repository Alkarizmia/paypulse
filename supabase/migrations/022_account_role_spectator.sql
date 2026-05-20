-- Rôle spectateur (lecture seule) + mise à jour factures réservée admin / membre.

alter table public.account_invites drop constraint if exists account_invites_role_check;
alter table public.account_invites
  add constraint account_invites_role_check check (role in ('admin', 'member', 'spectator'));

alter table public.account_members drop constraint if exists account_members_role_check;
alter table public.account_members
  add constraint account_members_role_check check (role in ('admin', 'member', 'spectator'));

create or replace function public.is_account_editor_for_owner(p_owner uuid)
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
        and m.role in ('admin', 'member')
    );
$$;

drop policy if exists "clients_update_own_ws" on public.clients;
create policy "clients_update_own_ws"
  on public.clients for update
  using (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_editor_for_owner(w.user_id)
    )
  )
  with check (
    workspace_id is not null
    and exists (
      select 1 from public.workspaces w
      where w.id = clients.workspace_id
        and public.is_account_editor_for_owner(w.user_id)
    )
  );

notify pgrst, 'reload schema';
