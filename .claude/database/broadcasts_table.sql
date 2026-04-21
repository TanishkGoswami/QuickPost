-- SIMPLE VERSION: Create broadcasts table WITHOUT RLS
-- This is simpler since our backend already handles authentication via JWT

-- Drop existing table if it exists
DROP TABLE IF EXISTS broadcasts CASCADE;

-- Create broadcasts table
CREATE TABLE broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    caption TEXT NOT NULL,
    video_filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    
    -- Instagram results
    instagram_success BOOLEAN,
    instagram_post_id TEXT,
    instagram_url TEXT,
    instagram_error TEXT,
    
    -- YouTube results
    youtube_success BOOLEAN,
    youtube_video_id TEXT,
    youtube_url TEXT,
    youtube_shorts_url TEXT,
    youtube_error TEXT,
    
    -- Timestamps
    scheduled_for TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_broadcasts_user_id ON broadcasts(user_id);
CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcasts_posted_at ON broadcasts(posted_at DESC);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_broadcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_broadcasts_updated_at_trigger
    BEFORE UPDATE ON broadcasts
    FOR EACH ROW
    EXECUTE FUNCTION update_broadcasts_updated_at();

-- Verify
SELECT * FROM broadcasts LIMIT 1;
