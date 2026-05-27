alter table public.instagram_accounts
add column if not exists webhook_instagram_user_id text;

create unique index if not exists idx_instagram_accounts_webhook_instagram_user_id
on public.instagram_accounts (webhook_instagram_user_id)
where webhook_instagram_user_id is not null;

