-- Migration: Add missing webhook_logs and reply_logs tables
-- These are required by the webhook edge function for event deduplication and rate limiting

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  ig_id text not null,
  sender_id text not null,
  message_text text,
  processed boolean not null default false,
  event_type text,
  event_id text,
  dedupe_key text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (dedupe_key)
);

alter table public.webhook_logs enable row level security;

create table if not exists public.reply_logs (
  id uuid primary key default gen_random_uuid(),
  ig_id text not null,
  sender_id text not null,
  automation_id uuid references public.automations(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reply_logs enable row level security;

-- Update can_send_automated_reply to work with reply_logs
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

grant execute on function public.can_send_automated_reply(text, text, int) to authenticated, service_role;
