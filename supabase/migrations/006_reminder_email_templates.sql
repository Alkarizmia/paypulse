-- Modèles d'e-mail persistés (relances auto + contenu), + préférence thème UI.

-- Thème dashboard / app shell (dark, light, ou suit le système)
alter table public.profiles
  add column if not exists ui_theme text not null default 'dark';

alter table public.profiles
  drop constraint if exists profiles_ui_theme_check;

alter table public.profiles
  add constraint profiles_ui_theme_check check (ui_theme in ('dark', 'light', 'system'));

-- Un modèle par délai J+n par portefeuille (contenu mail + lien paiement optionnel)
create table if not exists public.reminder_email_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  days_after_due integer not null check (days_after_due >= 0 and days_after_due <= 120),
  subject_template text not null,
  body_template text not null,
  payment_link text,
  sort_order integer not null default 0,
  status_scope text not null default 'unpaid'
    check (status_scope in ('unpaid', 'paid', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, days_after_due)
);

create index if not exists reminder_email_templates_workspace_idx
  on public.reminder_email_templates (workspace_id, sort_order asc);

alter table public.reminder_email_templates enable row level security;

drop policy if exists "reminder_email_templates_select" on public.reminder_email_templates;
create policy "reminder_email_templates_select"
  on public.reminder_email_templates for select
  using (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_insert" on public.reminder_email_templates;
create policy "reminder_email_templates_insert"
  on public.reminder_email_templates for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_update" on public.reminder_email_templates;
create policy "reminder_email_templates_update"
  on public.reminder_email_templates for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "reminder_email_templates_delete" on public.reminder_email_templates;
create policy "reminder_email_templates_delete"
  on public.reminder_email_templates for delete
  using (auth.uid() = owner_user_id);

-- Rétro-remplissage : une ligne par jour déjà configuré dans reminder_rules
insert into public.reminder_email_templates (
  workspace_id,
  owner_user_id,
  days_after_due,
  subject_template,
  body_template,
  payment_link,
  sort_order,
  status_scope
)
select
  rr.workspace_id,
  rr.owner_user_id,
  x.day,
  'Rappel J+' || x.day || ' — facture en attente ({{clientName}})',
  'Bonjour,' || chr(10) || chr(10)
    || 'Petit rappel concernant la facture de {{amount}} € échue le {{dueDate}}.' || chr(10)
    || 'Relance programmée automatiquement à J+' || x.day || '.' || chr(10)
    || 'Merci de nous confirmer la date de règlement.' || chr(10) || chr(10)
    || 'Cordialement,' || chr(10)
    || 'PayPulss',
  null,
  x.ord::integer,
  'unpaid'
from public.reminder_rules rr
cross join lateral unnest(rr.days_after_due) with ordinality as x(day, ord)
on conflict (workspace_id, days_after_due) do nothing;
