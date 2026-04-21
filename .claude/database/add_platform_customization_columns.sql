-- Add platform-specific customization columns to broadcasts table
-- Run this migration in Supabase SQL Editor

-- Instagram customization
ALTER TABLE broadcasts 
ADD COLUMN IF NOT EXISTS instagram_first_comment TEXT;

-- Pinterest customization
ALTER TABLE broadcasts 
ADD COLUMN IF NOT EXISTS pinterest_title VARCHAR(500),
ADD COLUMN IF NOT EXISTS pinterest_link VARCHAR(1000),
ADD COLUMN IF NOT EXISTS pinterest_board_id VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN broadcasts.instagram_first_comment IS 'First comment to be posted on Instagram (typically for hashtags)';
COMMENT ON COLUMN broadcasts.pinterest_title IS 'Title for Pinterest Pin';
COMMENT ON COLUMN broadcasts.pinterest_link IS 'Destination link for Pinterest Pin';
COMMENT ON COLUMN broadcasts.pinterest_board_id IS 'Pinterest board ID where pin was posted';
