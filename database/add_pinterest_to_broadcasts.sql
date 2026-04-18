-- Add Pinterest columns to broadcasts table
ALTER TABLE broadcasts
ADD COLUMN IF NOT EXISTS pinterest_success BOOLEAN,
ADD COLUMN IF NOT EXISTS pinterest_pin_id TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_error TEXT;

-- Run this in your Supabase SQL Editor
