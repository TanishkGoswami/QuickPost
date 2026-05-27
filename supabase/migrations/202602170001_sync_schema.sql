-- Migration: Sync Frontend Schema
-- Description: Adds missing tables and aligns existing ones with src/lib/database.types.ts

-- 1. PROFILES Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by own user"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- 2. SUBSCRIPTIONS Table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

create policy "Subscriptions are viewable by own user"
on public.subscriptions for select
using (auth.uid() = user_id);

-- 3. ALIGN INSTAGRAM_ACCOUNTS Table
-- The existing table uses ig_id but the frontend expects instagram_user_id
-- We will use a view or rename columns. Renaming is cleaner for the new schema.
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='ig_id') then
    alter table public.instagram_accounts rename column ig_id to instagram_user_id;
  end if;
  
  if exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='access_token') then
    alter table public.instagram_accounts rename column access_token to access_token_encrypted;
  end if;

  -- Add missing columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='full_name') then
    alter table public.instagram_accounts add column full_name text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='profile_picture_url') then
    alter table public.instagram_accounts add column profile_picture_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='account_type') then
    alter table public.instagram_accounts add column account_type text not null default 'BUSINESS' check (account_type in ('BUSINESS', 'CREATOR'));
  end if;

  if not exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='followers_count') then
    alter table public.instagram_accounts add column followers_count int default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='instagram_accounts' and column_name='media_count') then
    alter table public.instagram_accounts add column media_count int default 0;
  end if;
end $$;

-- 4. ALIGN AUTOMATIONS Table
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name='automations' and column_name='ig_account_id') then
    alter table public.automations rename column ig_account_id to instagram_account_id;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='user_id') then
    alter table public.automations add column user_id uuid references auth.users(id) on delete cascade;
    -- Populate user_id from instagram_accounts if possible
    update public.automations a
    set user_id = ia.user_id
    from public.instagram_accounts ia
    where a.instagram_account_id = ia.id;
    
    alter table public.automations alter column user_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='name') then
    alter table public.automations add column name text not null default 'Untitled';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='media_id') then
    alter table public.automations add column media_id text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='media_url') then
    alter table public.automations add column media_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='media_thumbnail') then
    alter table public.automations add column media_thumbnail text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='keywords') then
    alter table public.automations add column keywords text[] default '{}';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='is_case_sensitive') then
    alter table public.automations add column is_case_sensitive boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='comment_reply_enabled') then
    alter table public.automations add column comment_reply_enabled boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='comment_reply_text') then
    alter table public.automations add column comment_reply_text text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='automations' and column_name='response_flow') then
    alter table public.automations add column response_flow jsonb not null default '{"nodes": []}';
  end if;
end $$;

-- 5. CONTACTS Table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  instagram_user_id text not null,
  username text not null,
  full_name text,
  profile_picture_url text,
  follower_count int default 0,
  is_following_you boolean not null default false,
  you_are_following boolean not null default false,
  first_interaction_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  total_messages_sent int not null default 0,
  total_messages_received int not null default 0,
  tags text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instagram_account_id, instagram_user_id)
);

alter table public.contacts enable row level security;

create policy "Contacts viewable by own user"
on public.contacts for select
using (auth.uid() = user_id);

-- 6. MESSAGES Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  content text,
  media_url text,
  instagram_message_id text,
  status text not null default 'sent',
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Messages viewable by own user"
on public.messages for select
using (auth.uid() = user_id);

-- 7. DAILY_METRICS Table
create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instagram_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  date date not null default current_date,
  messages_sent int not null default 0,
  messages_seen int not null default 0,
  total_clicks int not null default 0,
  followers_gained int not null default 0,
  leads_captured int not null default 0,
  created_at timestamptz not null default now(),
  unique (instagram_account_id, date)
);

alter table public.daily_metrics enable row level security;

create policy "Metrics viewable by own user"
on public.daily_metrics for select
using (auth.uid() = user_id);

-- 8. Additional Triggers and Functions
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply triggers to new tables
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
