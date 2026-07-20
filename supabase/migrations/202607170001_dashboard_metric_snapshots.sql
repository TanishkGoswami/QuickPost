create table if not exists public.social_account_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,
  account_id text not null,
  snapshot_date date not null,
  followers_count integer,
  media_count integer,
  reach integer,
  impressions integer,
  profile_views integer,
  raw_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, account_id, snapshot_date)
);

create index if not exists social_account_metric_snapshots_lookup_idx
  on public.social_account_metric_snapshots (user_id, provider, account_id, snapshot_date desc);

alter table public.social_account_metric_snapshots enable row level security;

drop policy if exists "Users can read own social account metric snapshots"
  on public.social_account_metric_snapshots;

create policy "Users can read own social account metric snapshots"
  on public.social_account_metric_snapshots
  for select
  using (auth.uid() = user_id);
