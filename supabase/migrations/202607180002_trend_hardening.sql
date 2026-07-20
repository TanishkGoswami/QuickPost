create table if not exists public.trend_source_health (
  source text primary key,
  last_fetch_at timestamptz not null default now(),
  last_success_at timestamptz,
  response_time_ms integer,
  last_error text,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists trend_source_health_last_success_idx
  on public.trend_source_health (last_success_at desc);

alter table public.trend_source_health enable row level security;

create table if not exists public.trend_refresh_locks (
  name text primary key,
  owner text not null,
  locked_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists trend_refresh_locks_locked_until_idx
  on public.trend_refresh_locks (locked_until);

alter table public.trend_refresh_locks enable row level security;

create or replace function public.try_acquire_trend_refresh_lock(
  p_name text,
  p_owner text,
  p_ttl_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  did_lock boolean;
begin
  insert into public.trend_refresh_locks (name, owner, locked_until, updated_at)
  values (p_name, p_owner, now() + make_interval(secs => greatest(p_ttl_seconds, 30)), now())
  on conflict (name) do update
    set owner = excluded.owner,
        locked_until = excluded.locked_until,
        updated_at = now()
    where public.trend_refresh_locks.locked_until <= now()
       or public.trend_refresh_locks.owner = excluded.owner;

  get diagnostics did_lock = row_count;
  return did_lock;
end;
$$;

create or replace function public.release_trend_refresh_lock(
  p_name text,
  p_owner text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.trend_refresh_locks
    set locked_until = now(),
        updated_at = now()
    where name = p_name
      and owner = p_owner;
end;
$$;

revoke all on function public.try_acquire_trend_refresh_lock(text, text, integer) from public;
revoke all on function public.release_trend_refresh_lock(text, text) from public;
grant execute on function public.try_acquire_trend_refresh_lock(text, text, integer) to service_role;
grant execute on function public.release_trend_refresh_lock(text, text) to service_role;
