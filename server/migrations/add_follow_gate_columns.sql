-- Migration: Add follow gate feature to automations
ALTER TABLE automations 
ADD COLUMN require_follow BOOLEAN DEFAULT FALSE,
ADD COLUMN fallback_comment_reply TEXT;
