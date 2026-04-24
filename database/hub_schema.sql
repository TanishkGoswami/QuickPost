-- ============================================================
-- QuickPost HUB Schema — Run this in Hub Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/uklxlappjcuvdqjvecfh/sql/new
-- ============================================================

-- ── 1. USERS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    google_id TEXT UNIQUE,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. SOCIAL TOKENS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS social_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    instagram_business_id TEXT,
    bluesky_did TEXT,
    bluesky_handle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- ── 3. BROADCASTS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    caption TEXT NOT NULL,
    video_filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',

    -- Instagram
    instagram_success BOOLEAN,
    instagram_post_id TEXT,
    instagram_url TEXT,
    instagram_error TEXT,
    instagram_first_comment TEXT,

    -- YouTube
    youtube_success BOOLEAN,
    youtube_video_id TEXT,
    youtube_url TEXT,
    youtube_shorts_url TEXT,
    youtube_error TEXT,

    -- Pinterest
    pinterest_title VARCHAR(500),
    pinterest_link VARCHAR(1000),
    pinterest_board_id VARCHAR(255),

    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_timezone TEXT DEFAULT 'UTC',
    processing_started_at TIMESTAMPTZ,
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    cancelled_at TIMESTAMPTZ,
    media_urls JSONB
);

-- ── 4. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_provider ON social_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_posted_at ON broadcasts(posted_at DESC);

-- ── 5. RLS DISABLE (service role will handle all reads/writes) ──
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts DISABLE ROW LEVEL SECURITY;

-- ── 6. VERIFY ────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
