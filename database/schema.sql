-- QuickPost MVP Database Schema (Phase 2 - OAuth Enhanabled)
-- Run this in your Supabase SQL Editor

-- Users table with OAuth support
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    google_id TEXT UNIQUE,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social tokens table
CREATE TABLE IF NOT EXISTS social_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('instagram', 'youtube')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    instagram_business_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for social_tokens table
CREATE POLICY "Users can view their own tokens"
    ON social_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON social_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON social_tokens FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_provider ON social_tokens(provider);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_social_tokens_updated_at
    BEFORE UPDATE ON social_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Example: Insert a test user and tokens (for development)
-- Replace with your actual values
/*
INSERT INTO users (id, email) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO social_tokens (user_id, provider, access_token, instagram_business_id)
VALUES 
    ('123e4567-e89b-12d3-a456-426614174000', 'instagram', 'YOUR_INSTAGRAM_ACCESS_TOKEN', 'YOUR_INSTAGRAM_BUSINESS_ID'),
    ('123e4567-e89b-12d3-a456-426614174000', 'youtube', 'YOUR_YOUTUBE_ACCESS_TOKEN', 'YOUR_YOUTUBE_REFRESH_TOKEN')
ON CONFLICT (user_id, provider) DO NOTHING;
*/
