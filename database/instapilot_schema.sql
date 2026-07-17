-- GAP InstaPilot / Instagram AI Bot Builder
-- Run in Supabase SQL editor. Uses official Meta OAuth/Webhooks/Graph API data only.

create extension if not exists vector;

create table if not exists instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  page_id text not null,
  page_name text,
  instagram_business_account_id text not null,
  instagram_username text,
  profile_picture_url text,
  access_token_encrypted text not null,
  token_expires_at timestamptz,
  permissions jsonb not null default '[]'::jsonb,
  webhook_status text not null default 'pending',
  token_status text not null default 'active',
  is_connected boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, instagram_business_account_id)
);

alter table instagram_accounts add column if not exists profile_picture_url text;

create table if not exists instagram_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  instagram_account_id uuid not null references instagram_accounts(id) on delete cascade,
  bot_name text not null,
  business_name text not null,
  tone text not null default 'friendly',
  language text not null default 'auto-detect',
  bot_goal text not null default 'support',
  fallback_message text not null default 'I am not fully sure about that. Our team will help you shortly.',
  welcome_message text not null default 'Hi! Welcome to {{business_name}}. How can I help you today?',
  quick_replies jsonb not null default '["Pricing","Services","Book a Call","Talk to Human"]'::jsonb,
  handoff_keywords jsonb not null default '["human","agent","call me","support"]'::jsonb,
  lead_fields jsonb not null default '["name","phone","email","requirement"]'::jsonb,
  business_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  human_handoff_enabled boolean not null default true,
  confidence_threshold numeric not null default 0.68,
  daily_reply_limit integer not null default 250,
  replies_sent_today integer not null default 0,
  last_reply_quota_reset date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_instagram_bot_per_account
  on instagram_bots(user_id, instagram_account_id)
  where is_active = true;

create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bot_id uuid not null references instagram_bots(id) on delete cascade,
  source_type text not null check (source_type in ('pdf','txt','docx','faq','website','product','pricing','policy','manual')),
  title text not null,
  original_file_url text,
  status text not null default 'pending' check (status in ('pending','processing','ready','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table knowledge_sources add column if not exists updated_at timestamptz not null default now();

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  bot_id uuid not null references instagram_bots(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists instagram_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bot_id uuid references instagram_bots(id) on delete set null,
  instagram_account_id uuid not null references instagram_accounts(id) on delete cascade,
  instagram_user_id text not null,
  instagram_username text,
  instagram_name text,
  profile_pic_url text,
  follower_count integer,
  is_user_follow_business boolean,
  is_business_follow_user boolean,
  status text not null default 'bot_active' check (status in ('bot_active','human_needed','human_active','closed')),
  assigned_to uuid references users(id) on delete set null,
  bot_paused boolean not null default false,
  failure_count integer not null default 0,
  lead_data jsonb not null default '{}'::jsonb,
  labels jsonb not null default '[]'::jsonb,
  notes text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instagram_account_id, instagram_user_id)
);

alter table instagram_conversations add column if not exists instagram_name text;
alter table instagram_conversations add column if not exists profile_pic_url text;
alter table instagram_conversations add column if not exists follower_count integer;
alter table instagram_conversations add column if not exists is_user_follow_business boolean;
alter table instagram_conversations add column if not exists is_business_follow_user boolean;

create table if not exists instagram_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bot_id uuid references instagram_bots(id) on delete set null,
  instagram_account_id uuid not null references instagram_accounts(id) on delete cascade,
  conversation_id uuid references instagram_conversations(id) on delete cascade,
  sender_id text,
  recipient_id text,
  message_text text,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text',
  ai_generated boolean not null default false,
  confidence_score numeric,
  status text not null default 'received',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists instagram_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bot_id uuid not null references instagram_bots(id) on delete cascade,
  conversation_id uuid not null references instagram_conversations(id) on delete cascade,
  name text,
  phone text,
  email text,
  requirement text,
  budget text,
  city text,
  preferred_time text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id)
);

create table if not exists instagram_update_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bot_id uuid not null references instagram_bots(id) on delete cascade,
  title text not null,
  message_text text not null,
  audience_filter jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','failed')),
  scheduled_at timestamptz,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  policy_acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instagram_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_instagram_accounts_user on instagram_accounts(user_id);
create index if not exists idx_instagram_bots_user_account on instagram_bots(user_id, instagram_account_id);
create index if not exists idx_knowledge_chunks_bot on knowledge_chunks(bot_id);
create index if not exists idx_instagram_conversations_user on instagram_conversations(user_id, last_message_at desc);
create index if not exists idx_instagram_messages_conversation on instagram_messages(conversation_id, created_at);
create index if not exists idx_instagram_leads_bot on instagram_leads(bot_id, created_at desc);

alter table instagram_accounts enable row level security;
alter table instagram_bots enable row level security;
alter table knowledge_sources enable row level security;
alter table knowledge_chunks enable row level security;
alter table instagram_conversations enable row level security;
alter table instagram_messages enable row level security;
alter table instagram_leads enable row level security;
alter table instagram_update_messages enable row level security;
alter table instagram_audit_logs enable row level security;

drop policy if exists "own instagram accounts" on instagram_accounts;
create policy "own instagram accounts" on instagram_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own instagram bots" on instagram_bots;
create policy "own instagram bots" on instagram_bots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own knowledge sources" on knowledge_sources;
create policy "own knowledge sources" on knowledge_sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own knowledge chunks" on knowledge_chunks;
create policy "own knowledge chunks" on knowledge_chunks for all using (
  exists (select 1 from knowledge_sources ks where ks.id = source_id and ks.user_id = auth.uid())
) with check (
  exists (select 1 from knowledge_sources ks where ks.id = source_id and ks.user_id = auth.uid())
);
drop policy if exists "own conversations" on instagram_conversations;
create policy "own conversations" on instagram_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own messages" on instagram_messages;
create policy "own messages" on instagram_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own instagram leads" on instagram_leads;
create policy "own instagram leads" on instagram_leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own update messages" on instagram_update_messages;
create policy "own update messages" on instagram_update_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own audit logs" on instagram_audit_logs;
create policy "own audit logs" on instagram_audit_logs for select using (auth.uid() = user_id);

create or replace function instapilot_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_instagram_accounts on instagram_accounts;
create trigger touch_instagram_accounts before update on instagram_accounts for each row execute function instapilot_touch_updated_at();
drop trigger if exists touch_instagram_bots on instagram_bots;
create trigger touch_instagram_bots before update on instagram_bots for each row execute function instapilot_touch_updated_at();
drop trigger if exists touch_instagram_conversations on instagram_conversations;
create trigger touch_instagram_conversations before update on instagram_conversations for each row execute function instapilot_touch_updated_at();
drop trigger if exists touch_instagram_leads on instagram_leads;
create trigger touch_instagram_leads before update on instagram_leads for each row execute function instapilot_touch_updated_at();
drop trigger if exists touch_instagram_update_messages on instagram_update_messages;
create trigger touch_instagram_update_messages before update on instagram_update_messages for each row execute function instapilot_touch_updated_at();
