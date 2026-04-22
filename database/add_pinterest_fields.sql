-- Add Pinterest support and media type to broadcasts table

-- Add media_type column
ALTER TABLE broadcasts
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video';

-- Add Pinterest result columns
ALTER TABLE broadcasts
ADD COLUMN IF NOT EXISTS pinterest_success BOOLEAN,
ADD COLUMN IF NOT EXISTS pinterest_pin_id TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_error TEXT;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'broadcasts'
ORDER BY ordinal_position;
