drop function if exists public.release_trend_refresh_lock(text, text);
drop function if exists public.try_acquire_trend_refresh_lock(text, text, integer);

drop table if exists public.trend_content_drafts cascade;
drop table if exists public.trend_snapshots cascade;
drop table if exists public.trend_source_health cascade;
drop table if exists public.trend_refresh_locks cascade;
drop table if exists public.trend_items cascade;
