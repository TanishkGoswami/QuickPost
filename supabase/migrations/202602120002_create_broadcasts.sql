-- Canonical broadcasts table used by publishing, scheduling, queue, and history.
-- Safe for both a fresh database and an existing production table.

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  caption text not null,
  video_filename text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.broadcasts
  add column if not exists media_type text default 'image',
  add column if not exists media_url text,
  add column if not exists media_urls text[],
  add column if not exists thumbnail_url text,
  add column if not exists selected_channels jsonb default '[]'::jsonb,
  add column if not exists platform_data jsonb default '{}'::jsonb,
  add column if not exists user_timezone text default 'UTC',
  add column if not exists instagram_success boolean,
  add column if not exists instagram_post_id text,
  add column if not exists instagram_url text,
  add column if not exists instagram_error text,
  add column if not exists youtube_success boolean,
  add column if not exists youtube_video_id text,
  add column if not exists youtube_url text,
  add column if not exists youtube_shorts_url text,
  add column if not exists youtube_error text,
  add column if not exists pinterest_success boolean,
  add column if not exists pinterest_pin_id text,
  add column if not exists pinterest_url text,
  add column if not exists pinterest_error text,
  add column if not exists facebook_success boolean,
  add column if not exists facebook_post_id text,
  add column if not exists facebook_url text,
  add column if not exists facebook_error text,
  add column if not exists linkedin_success boolean,
  add column if not exists linkedin_post_id text,
  add column if not exists linkedin_url text,
  add column if not exists linkedin_error text,
  add column if not exists mastodon_success boolean,
  add column if not exists mastodon_post_id text,
  add column if not exists mastodon_url text,
  add column if not exists mastodon_error text,
  add column if not exists bluesky_success boolean,
  add column if not exists bluesky_post_id text,
  add column if not exists bluesky_url text,
  add column if not exists bluesky_error text,
  add column if not exists threads_success boolean,
  add column if not exists threads_post_id text,
  add column if not exists threads_url text,
  add column if not exists threads_error text,
  add column if not exists x_success boolean,
  add column if not exists x_post_id text,
  add column if not exists x_url text,
  add column if not exists x_error text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists posted_at timestamptz;

create index if not exists idx_broadcasts_user_id on public.broadcasts(user_id);
create index if not exists idx_broadcasts_status on public.broadcasts(status);
create index if not exists idx_broadcasts_posted_at
  on public.broadcasts(posted_at desc);
create index if not exists idx_broadcasts_user_queue
  on public.broadcasts(user_id, status, scheduled_for);

create or replace function public.update_broadcasts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_broadcasts_updated_at_trigger on public.broadcasts;
create trigger update_broadcasts_updated_at_trigger
before update on public.broadcasts
for each row execute function public.update_broadcasts_updated_at();

alter table public.broadcasts enable row level security;

drop policy if exists "Users can manage their own broadcasts" on public.broadcasts;
create policy "Users can manage their own broadcasts"
on public.broadcasts
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
