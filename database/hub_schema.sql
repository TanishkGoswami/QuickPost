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

-- ── 2. SOCIAL PAYMENTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT UNIQUE,
    plan_tier TEXT,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 3. SOCIAL TOKENS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS social_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('instagram', 'youtube', 'pinterest', 'facebook', 'bluesky', 'linkedin', 'mastodon', 'tiktok', 'threads', 'x', 'reddit')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Platform-specific identifiers
    instagram_business_id TEXT,
    pinterest_username TEXT,
    facebook_page_id TEXT,
    facebook_page_name TEXT,
    bluesky_did TEXT,
    bluesky_handle TEXT,
    mastodon_instance TEXT,

    -- Generic fields
    page_id TEXT,
    account_id TEXT,
    account_name TEXT,
    username TEXT,

    -- Profile data
    profile_data JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- ── 4. BROADCASTS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    caption TEXT NOT NULL,
    video_filename TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'processing', 'sent', 'partially_sent', 'failed', 'cancelled')),

    -- Instagram
    instagram_success BOOLEAN,
    instagram_post_id TEXT,
    instagram_url TEXT,
    instagram_error TEXT,

    -- YouTube
    youtube_success BOOLEAN,
    youtube_video_id TEXT,
    youtube_url TEXT,
    youtube_shorts_url TEXT,
    youtube_error TEXT,

    -- Pinterest
    pinterest_success BOOLEAN,
    pinterest_pin_id TEXT,
    pinterest_url TEXT,
    pinterest_error TEXT,
    pinterest_board_id TEXT,
    pinterest_title VARCHAR(500),
    pinterest_link VARCHAR(1000),

    -- Facebook
    facebook_success BOOLEAN,
    facebook_post_id TEXT,
    facebook_url TEXT,
    facebook_error TEXT,

    -- Bluesky
    bluesky_success BOOLEAN,
    bluesky_post_id TEXT,
    bluesky_url TEXT,
    bluesky_error TEXT,

    -- LinkedIn
    linkedin_success BOOLEAN DEFAULT FALSE,
    linkedin_post_id TEXT,
    linkedin_url TEXT,
    linkedin_error TEXT,

    -- Mastodon
    mastodon_success BOOLEAN DEFAULT FALSE,
    mastodon_post_id TEXT,
    mastodon_url TEXT,
    mastodon_error TEXT,

    -- TikTok
    tiktok_success BOOLEAN DEFAULT FALSE,
    tiktok_publish_id TEXT,
    tiktok_error TEXT,

    -- Threads
    threads_success BOOLEAN DEFAULT FALSE,
    threads_post_id TEXT,
    threads_url TEXT,
    threads_error TEXT,

    -- X (Twitter)
    x_success BOOLEAN DEFAULT FALSE,
    x_post_id TEXT,
    x_url TEXT,
    x_error TEXT,

    -- Scheduling & Media
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_timezone TEXT DEFAULT 'UTC',
    processing_started_at TIMESTAMPTZ,
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    cancelled_at TIMESTAMPTZ,

    -- Media & Platform Data
    media_type TEXT DEFAULT 'video',
    media_url TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    platform_data JSONB DEFAULT '{}'::jsonb,
    selected_channels JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT
);

-- ── 5. USER ONBOARDING TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    channels TEXT[] DEFAULT '{}'::text[],
    tools TEXT[] DEFAULT '{}'::text[],
    user_type TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 6. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_payments_user_id ON social_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_payments_status ON social_payments(status);
CREATE INDEX IF NOT EXISTS idx_social_payments_created_at ON social_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_provider ON social_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_posted_at ON broadcasts(posted_at DESC);

-- ── 7. RLS DISABLE (service role will handle all reads/writes) ──
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding DISABLE ROW LEVEL SECURITY;

-- ── 8. VERIFY ────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
