-- Standalone QuickPost subscription, entitlement, and usage foundation.
-- Hub subscriptions can later be mirrored into app_subscriptions without
-- changing any application feature checks.

create table if not exists public.app_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null default 'free'
    check (plan_id in ('free', 'pro', 'enterprise')),
  source text not null default 'standalone'
    check (source in ('standalone', 'hub', 'admin')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  billing_interval text
    check (billing_interval is null or billing_interval in ('month', 'year')),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  grace_period_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source)
);

create unique index if not exists app_subscriptions_provider_subscription_uidx
  on public.app_subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists app_subscriptions_user_status_idx
  on public.app_subscriptions (user_id, status);

create table if not exists public.entitlement_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null,
  period_start date not null,
  period_end date not null,
  used bigint not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, metric, period_start)
);

create index if not exists entitlement_usage_user_period_idx
  on public.entitlement_usage (user_id, period_end);

alter table public.app_subscriptions enable row level security;
alter table public.entitlement_usage enable row level security;

drop policy if exists "Users can read own app subscription" on public.app_subscriptions;
create policy "Users can read own app subscription"
  on public.app_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own entitlement usage" on public.entitlement_usage;
create policy "Users can read own entitlement usage"
  on public.entitlement_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Service-role callers use this to atomically reserve usage before work starts.
create or replace function public.consume_entitlement_usage(
  p_user_id uuid,
  p_metric text,
  p_amount bigint,
  p_limit bigint,
  p_period_start date,
  p_period_end date
)
returns table (allowed boolean, used bigint, limit_value bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used bigint;
  next_used bigint;
begin
  if p_amount <= 0 or p_limit < 0 then
    raise exception 'Invalid entitlement usage arguments';
  end if;

  -- Serialize each user's metric/period so the limit check and increment are atomic,
  -- including the first insert.
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_metric || ':' || p_period_start::text, 0)
  );

  select eu.used into current_used
  from public.entitlement_usage eu
  where eu.user_id = p_user_id
    and eu.metric = p_metric
    and eu.period_start = p_period_start;

  current_used := coalesce(current_used, 0);
  if current_used + p_amount > p_limit then
    return query select false, current_used, p_limit;
    return;
  end if;

  next_used := current_used + p_amount;
  insert into public.entitlement_usage (
    user_id, metric, period_start, period_end, used, updated_at
  )
  values (
    p_user_id, p_metric, p_period_start, p_period_end, next_used, now()
  )
  on conflict (user_id, metric, period_start)
  do update set
    used = excluded.used,
    period_end = excluded.period_end,
    updated_at = now();

  return query select true, next_used, p_limit;
end;
$$;

revoke all on function public.consume_entitlement_usage(uuid, text, bigint, bigint, date, date)
  from public, anon, authenticated;
grant execute on function public.consume_entitlement_usage(uuid, text, bigint, bigint, date, date)
  to service_role;
