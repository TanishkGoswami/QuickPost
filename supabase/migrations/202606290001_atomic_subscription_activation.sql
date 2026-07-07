-- Permanently record each paid provider event and activate fixed-term access
-- atomically. This prevents old payment links from being replayed after a newer
-- purchase replaces app_subscriptions.provider_subscription_id.

create table if not exists public.subscription_payment_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  plan_id text not null check (plan_id in ('pro', 'enterprise')),
  interval_months integer not null check (interval_months in (1, 3, 6, 12)),
  amount_paid bigint not null check (amount_paid > 0),
  activated_at timestamptz not null default now(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  unique (provider, provider_payment_id)
);

create index if not exists subscription_payment_activations_user_idx
  on public.subscription_payment_activations (user_id, activated_at desc);

alter table public.subscription_payment_activations enable row level security;

drop policy if exists "Users can read own subscription activations"
  on public.subscription_payment_activations;
create policy "Users can read own subscription activations"
  on public.subscription_payment_activations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.activate_fixed_term_subscription(
  p_user_id uuid,
  p_plan_id text,
  p_provider text,
  p_provider_payment_id text,
  p_interval_months integer,
  p_amount_paid bigint
)
returns table (
  processed boolean,
  period_start timestamptz,
  period_end timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_existing_end timestamptz;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if p_plan_id not in ('pro', 'enterprise')
    or p_interval_months not in (1, 3, 6, 12)
    or p_amount_paid <= 0
    or nullif(trim(p_provider_payment_id), '') is null then
    raise exception 'Invalid subscription activation arguments';
  end if;

  -- Serialize every activation for this user, including different payment IDs.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (
    select 1
    from public.subscription_payment_activations spa
    where spa.provider = p_provider
      and spa.provider_payment_id = p_provider_payment_id
  ) then
    return query
      select false, spa.period_start, spa.period_end
      from public.subscription_payment_activations spa
      where spa.provider = p_provider
        and spa.provider_payment_id = p_provider_payment_id;
    return;
  end if;

  select aps.current_period_end
    into v_existing_end
  from public.app_subscriptions aps
  where aps.user_id = p_user_id
    and aps.source = 'standalone'
  for update;

  v_period_start := case
    when v_existing_end is not null and v_existing_end > v_now then v_existing_end
    else v_now
  end;
  v_period_end := v_period_start + make_interval(months => p_interval_months);

  insert into public.subscription_payment_activations (
    user_id,
    provider,
    provider_payment_id,
    plan_id,
    interval_months,
    amount_paid,
    period_start,
    period_end
  )
  values (
    p_user_id,
    p_provider,
    p_provider_payment_id,
    p_plan_id,
    p_interval_months,
    p_amount_paid,
    v_period_start,
    v_period_end
  );

  insert into public.app_subscriptions (
    user_id,
    plan_id,
    source,
    provider,
    provider_subscription_id,
    billing_interval,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    updated_at
  )
  values (
    p_user_id,
    p_plan_id,
    'standalone',
    p_provider,
    p_provider_payment_id,
    case when p_interval_months = 12 then 'year' else 'month' end,
    'active',
    v_period_start,
    v_period_end,
    false,
    v_now
  )
  on conflict (user_id, source)
  do update set
    plan_id = excluded.plan_id,
    provider = excluded.provider,
    provider_subscription_id = excluded.provider_subscription_id,
    billing_interval = excluded.billing_interval,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = false,
    updated_at = excluded.updated_at;

  return query select true, v_period_start, v_period_end;
end;
$$;

revoke all on function public.activate_fixed_term_subscription(
  uuid, text, text, text, integer, bigint
) from public, anon, authenticated;
grant execute on function public.activate_fixed_term_subscription(
  uuid, text, text, text, integer, bigint
) to service_role;
