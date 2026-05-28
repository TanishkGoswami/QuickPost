alter table knowledge_sources
  add column if not exists updated_at timestamptz not null default now();

with ranked_active_bots as (
  select
    id,
    row_number() over (
      partition by user_id, instagram_account_id
      order by updated_at desc, created_at desc
    ) as active_rank
  from instagram_bots
  where is_active = true
)
update instagram_bots
set is_active = false, updated_at = now()
where id in (
  select id from ranked_active_bots where active_rank > 1
);

create unique index if not exists one_active_instagram_bot_per_account
  on instagram_bots(user_id, instagram_account_id)
  where is_active = true;
