create table if not exists public.trend_items (
  id text primary key,
  external_id text not null,
  source text not null,
  type text not null check (type in ('post', 'article', 'question', 'repository', 'topic')),
  title text not null,
  description text,
  author_name text,
  author_username text,
  author_avatar text,
  original_url text not null,
  image_url text,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  category text not null,
  language text,
  country text,
  tags text[] not null default '{}',
  engagement jsonb not null default '{"likes":0,"comments":0,"shares":0,"views":0,"score":0}'::jsonb,
  trend_score integer not null default 1,
  score_breakdown jsonb not null default '{"engagement":0,"freshness":0,"crossPlatformPresence":0,"weights":{"engagement":45,"freshness":35,"crossPlatformPresence":20}}'::jsonb,
  opportunity_score integer not null default 1,
  lifecycle text not null check (lifecycle in ('rising', 'hot', 'peaked', 'falling')),
  calculated_at timestamptz not null default now(),
  cluster_id text,
  cross_platform_count integer not null default 1,
  platform_badges text[] not null default '{}',
  cluster_items jsonb not null default '[]'::jsonb,
  match_confidence numeric,
  match_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trend_items_source_idx on public.trend_items (source);
create index if not exists trend_items_published_at_idx on public.trend_items (published_at desc);
create index if not exists trend_items_trend_score_idx on public.trend_items (trend_score desc);
create unique index if not exists trend_items_source_external_id_idx on public.trend_items (source, external_id);

alter table public.trend_items add column if not exists score_breakdown jsonb not null default '{"engagement":0,"freshness":0,"crossPlatformPresence":0,"weights":{"engagement":45,"freshness":35,"crossPlatformPresence":20}}'::jsonb;
alter table public.trend_items add column if not exists calculated_at timestamptz not null default now();
alter table public.trend_items add column if not exists cluster_id text;
alter table public.trend_items add column if not exists cross_platform_count integer not null default 1;
alter table public.trend_items add column if not exists platform_badges text[] not null default '{}';
alter table public.trend_items add column if not exists cluster_items jsonb not null default '[]'::jsonb;
alter table public.trend_items add column if not exists match_confidence numeric;
alter table public.trend_items add column if not exists match_reason text;

create index if not exists trend_items_cluster_id_idx on public.trend_items (cluster_id) where cluster_id is not null;
create index if not exists trend_items_cross_platform_count_idx on public.trend_items (cross_platform_count desc);

create table if not exists public.trend_snapshots (
  id bigserial primary key,
  trend_item_id text not null references public.trend_items(id) on delete cascade,
  cluster_id text,
  source text not null,
  engagement jsonb not null default '{"likes":0,"comments":0,"shares":0,"views":0,"score":0}'::jsonb,
  trend_score integer not null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trend_snapshots_trend_item_id_idx on public.trend_snapshots (trend_item_id);
create index if not exists trend_snapshots_captured_at_idx on public.trend_snapshots (captured_at desc);
create index if not exists trend_snapshots_trend_item_captured_at_idx on public.trend_snapshots (trend_item_id, captured_at desc);
create index if not exists trend_snapshots_cluster_captured_at_idx on public.trend_snapshots (cluster_id, captured_at desc) where cluster_id is not null;

create table if not exists public.trend_content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trend_item_id text references public.trend_items(id) on delete set null,
  cluster_id text,
  target_platform text not null,
  content_language text not null,
  content_format text not null,
  content_goal text not null,
  tone text not null,
  target_audience text not null,
  content jsonb not null,
  source_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trend_content_drafts_user_created_idx on public.trend_content_drafts (user_id, created_at desc);
create index if not exists trend_content_drafts_trend_idx on public.trend_content_drafts (trend_item_id, created_at desc);
