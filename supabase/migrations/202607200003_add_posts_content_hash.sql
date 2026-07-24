alter table public.posts
  add column if not exists content_hash text;

create unique index if not exists posts_content_hash_key
  on public.posts (content_hash)
  where content_hash is not null;
