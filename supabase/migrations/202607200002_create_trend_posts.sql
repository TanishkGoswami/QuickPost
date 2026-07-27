create extension if not exists vector;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null,
  source_url text not null,
  embed_html text,
  thumbnail_url text,
  caption text,
  engagement_score numeric not null default 0,
  niche_tags text[] not null default '{}',
  published_at timestamptz,
  ingested_at timestamptz not null default now(),
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_source_platform_check check (source_platform <> ''),
  constraint posts_source_url_check check (source_url ~* '^https?://')
);

create unique index if not exists posts_source_url_key
  on public.posts (source_url);

create index if not exists posts_feed_idx
  on public.posts (published_at desc nulls last, engagement_score desc, ingested_at desc);

create index if not exists posts_niche_tags_idx
  on public.posts using gin (niche_tags);

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists "Authenticated users can read trend posts" on public.posts;
create policy "Authenticated users can read trend posts"
on public.posts for select
to authenticated
using (true);
