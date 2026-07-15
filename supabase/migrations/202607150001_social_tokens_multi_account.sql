-- Allow multiple connected accounts per provider in social_tokens.
-- Existing rows are backfilled before the old single-provider uniqueness is removed.

alter table public.social_tokens
  add column if not exists account_id text,
  add column if not exists page_id text,
  add column if not exists username text,
  add column if not exists profile_data jsonb,
  add column if not exists expires_at timestamptz,
  add column if not exists pinterest_board_id text;

update public.social_tokens
set account_id = coalesce(
  nullif(account_id, ''),
  nullif(page_id, ''),
  nullif(instagram_business_id, ''),
  nullif(bluesky_did, ''),
  nullif(bluesky_handle, ''),
  nullif(mastodon_instance, ''),
  nullif(username, ''),
  id::text
)
where account_id is null or account_id = '';

alter table public.social_tokens
  alter column account_id set not null;

alter table public.social_tokens
  drop constraint if exists social_tokens_user_id_provider_key;

drop index if exists public.social_tokens_user_id_provider_key;

alter table public.social_tokens
  add constraint social_tokens_user_provider_account_key
  unique (user_id, provider, account_id);

create index if not exists idx_social_tokens_user_provider
  on public.social_tokens(user_id, provider);
