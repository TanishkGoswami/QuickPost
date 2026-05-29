alter table public.automations
add column if not exists schedule_type text not null default 'manual'
  check (schedule_type in ('manual', 'duration', 'custom')),
add column if not exists starts_at timestamptz,
add column if not exists ends_at timestamptz,
add column if not exists expired_at timestamptz;

create index if not exists idx_automations_active_schedule
on public.automations (instagram_account_id, is_active, starts_at, ends_at);

update public.automations
set schedule_type = 'manual'
where schedule_type is null;
