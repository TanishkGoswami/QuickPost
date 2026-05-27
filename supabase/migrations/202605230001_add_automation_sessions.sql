create table if not exists public.automation_sessions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  instagram_account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  sender_id text not null,
  expected_keywords text[] not null default array['setup'],
  next_node_index int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_automation_sessions_pending_sender
on public.automation_sessions (instagram_account_id, sender_id, status, expires_at desc);

create unique index if not exists idx_automation_sessions_one_pending
on public.automation_sessions (automation_id, instagram_account_id, sender_id)
where status = 'pending';

alter table public.automation_sessions enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "automation_sessions_select_own" on public.automation_sessions;
create policy "automation_sessions_select_own"
on public.automation_sessions
for select
using (
  exists (
    select 1
    from public.instagram_accounts ia
    where ia.id = automation_sessions.instagram_account_id
      and ia.user_id = auth.uid()
  )
);

drop trigger if exists set_automation_sessions_updated_at on public.automation_sessions;
create trigger set_automation_sessions_updated_at
before update on public.automation_sessions
for each row execute function public.set_updated_at();
