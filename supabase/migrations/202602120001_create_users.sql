-- Canonical QuickPost application user table.
-- Supabase Auth remains in auth.users; application and Hub data live here.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  google_id text unique,
  profile_picture text,
  plan text not null default 'Free',
  subscription_status text not null default 'active',
  hub_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_hub_user_id
  on public.users (hub_user_id)
  where hub_user_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "Users can view their own data" on public.users;
create policy "Users can view their own data"
on public.users for select
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own data" on public.users;
create policy "Users can insert their own data"
on public.users for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own data" on public.users;
create policy "Users can update their own data"
on public.users for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
