alter table public.automations alter column keyword drop not null;
alter table public.automations alter column keyword set default '';
alter table public.automations alter column reply_text drop not null;
alter table public.automations alter column reply_text set default '';

-- Relax trigger type constraint
alter table public.automations drop constraint if exists automations_trigger_type_check;
