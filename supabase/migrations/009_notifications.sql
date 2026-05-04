-- Notifications dashboard (cloche)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  notification_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc);
create index if not exists notifications_recipient_read_idx
  on public.notifications (recipient_user_id, read_at);
create unique index if not exists notifications_key_unique_idx
  on public.notifications (notification_key)
  where notification_key is not null;

alter table public.notifications enable row level security;

create or replace function public.is_member_of_owner_for_user(p_user uuid, p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user = p_owner
    or exists (
      select 1 from public.account_members m
      where m.owner_user_id = p_owner
        and m.member_user_id = p_user
    );
$$;

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient"
  on public.notifications for select
  using (auth.uid() = recipient_user_id);

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient"
  on public.notifications for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

drop policy if exists "notifications_insert_actor" on public.notifications;
create policy "notifications_insert_actor"
  on public.notifications for insert
  with check (
    auth.uid() = actor_user_id
    and (
      workspace_id is null
      or exists (
        select 1 from public.workspaces w
        where w.id = notifications.workspace_id
          and (
            public.is_member_of_owner_for_user(auth.uid(), w.user_id)
            and public.is_member_of_owner_for_user(recipient_user_id, w.user_id)
          )
      )
    )
  );
