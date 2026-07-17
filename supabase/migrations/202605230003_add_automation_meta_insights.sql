alter table public.automations
add column if not exists follower_count_at_create int,
add column if not exists latest_followers_count int,
add column if not exists media_like_count int,
add column if not exists media_comments_count int,
add column if not exists media_view_count int,
add column if not exists media_caption text,
add column if not exists media_permalink text,
add column if not exists media_insights_synced_at timestamptz;

update public.automations a
set follower_count_at_create = ia.followers_count,
    latest_followers_count = ia.followers_count
from public.instagram_accounts ia
where a.instagram_account_id = ia.id
  and a.follower_count_at_create is null
  and ia.followers_count is not null;
