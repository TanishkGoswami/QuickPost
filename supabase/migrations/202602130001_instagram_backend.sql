create extension if not exists pgcrypto;

create table if not exists public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id text not null,
  ig_id text not null,
  access_token text not null,
  token_expires_at timestamptz not null,
  username text,
  is_connected boolean not null default true,
  token_last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, ig_id),
  unique (user_id, ig_id)
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('dm', 'comment')),
  keyword text not null,
  reply_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  ig_id text not null,
  sender_id text not null,
  message_text text,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  event_type text,
  event_id text,
  dedupe_key text not null,
  payload jsonb,
  unique (dedupe_key)
);

create table if not exists public.reply_logs (
  id uuid primary key default gen_random_uuid(),
  ig_id text not null,
  sender_id text not null,
  automation_id uuid references public.automations(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_instagram_accounts_user_id on public.instagram_accounts(user_id);
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='ig_id') then
    execute 'create index if not exists idx_instagram_accounts_ig_id on public.instagram_accounts(ig_id)';
  elsif exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='instagram_user_id') then
    execute 'create index if not exists idx_instagram_accounts_ig_id on public.instagram_accounts(instagram_user_id)';
  end if;
end $$;
create index if not exists idx_automations_ig_account_id on public.automations(ig_account_id);
create index if not exists idx_automations_active_trigger on public.automations(ig_account_id, trigger_type, is_active);
create index if not exists idx_webhook_logs_ig_sender_created on public.webhook_logs(ig_id, sender_id, created_at desc);
create index if not exists idx_reply_logs_ig_sender_created on public.reply_logs(ig_id, sender_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_instagram_accounts_updated_at on public.instagram_accounts;
create trigger trg_instagram_accounts_updated_at
before update on public.instagram_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_automations_updated_at on public.automations;
create trigger trg_automations_updated_at
before update on public.automations
for each row execute function public.set_updated_at();

create or replace function public.can_send_automated_reply(
  p_ig_id text,
  p_sender_id text,
  p_max_count int default 5
)
returns boolean
language sql
stable
as $$
  select (
    select count(*)
    from public.reply_logs rl
    where rl.ig_id = p_ig_id
      and rl.sender_id = p_sender_id
      and rl.created_at >= now() - interval '24 hours'
  ) < p_max_count;
$$;

create or replace function public.is_instagram_account_owner(p_ig_id text, p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_owned boolean;
begin
  if exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='ig_id') then
    execute 'select exists (select 1 from public.instagram_accounts where ig_id = $1 and user_id = $2)'
    into v_owned
    using p_ig_id, p_user_id;
  elsif exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='instagram_user_id') then
    execute 'select exists (select 1 from public.instagram_accounts where instagram_user_id = $1 and user_id = $2)'
    into v_owned
    using p_ig_id, p_user_id;
  else
    v_owned := false;
  end if;
  return coalesce(v_owned, false);
end;
$$;

grant execute on function public.is_instagram_account_owner(text, uuid) to authenticated, service_role;

alter table public.instagram_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.reply_logs enable row level security;

drop policy if exists "instagram_accounts_select_own" on public.instagram_accounts;
create policy "instagram_accounts_select_own"
on public.instagram_accounts
for select
using (auth.uid() = user_id);

drop policy if exists "instagram_accounts_modify_own" on public.instagram_accounts;
create policy "instagram_accounts_modify_own"
on public.instagram_accounts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "automations_select_own" on public.automations;
create policy "automations_select_own"
on public.automations
for select
using (
  exists (
    select 1
    from public.instagram_accounts ia
    where ia.id = automations.ig_account_id
      and ia.user_id = auth.uid()
  )
);

drop policy if exists "automations_modify_own" on public.automations;
create policy "automations_modify_own"
on public.automations
for all
using (
  exists (
    select 1
    from public.instagram_accounts ia
    where ia.id = automations.ig_account_id
      and ia.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.instagram_accounts ia
    where ia.id = automations.ig_account_id
      and ia.user_id = auth.uid()
  )
);

drop policy if exists "webhook_logs_select_own" on public.webhook_logs;
create policy "webhook_logs_select_own"
on public.webhook_logs
for select
using (
  public.is_instagram_account_owner(webhook_logs.ig_id, auth.uid())
);

drop policy if exists "reply_logs_select_own" on public.reply_logs;
create policy "reply_logs_select_own"
on public.reply_logs
for select
using (
  public.is_instagram_account_owner(reply_logs.ig_id, auth.uid())
);

grant execute on function public.can_send_automated_reply(text, text, int) to authenticated, service_role;
