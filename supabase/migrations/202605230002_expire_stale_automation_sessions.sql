update public.automation_sessions s
set status = 'expired',
    updated_at = now()
where status = 'pending'
  and not exists (
    select 1
    from public.automations a
    where a.id = s.automation_id
      and a.is_active = true
      and a.name not like '% - DM Follow-up%'
  );
