-- Attribution vidéos / campagnes : source (?src= / utm) + langue UI.
-- À appliquer manuellement sur Supabase (SQL Editor) avant la campagne TikTok/Reels.

alter table public.waitlist
  add column if not exists source text,
  add column if not exists langue text;

comment on column public.waitlist.source is 'Attribution marketing (ex. tiktok, reel:mars).';
comment on column public.waitlist.langue is 'Locale UI au moment de l''inscription (fr, en, …).';

create index if not exists waitlist_source_idx on public.waitlist (source);
create index if not exists waitlist_langue_idx on public.waitlist (langue);
