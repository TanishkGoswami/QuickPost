-- Phase 2 Migration: Add OAuth columns to users table
-- Run this in your Supabase SQL Editor

-- Add new columns for OAuth user data
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS google_id TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint for google_id
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_google_id_key;

ALTER TABLE users
ADD CONSTRAINT users_google_id_key UNIQUE (google_id);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON users;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'users'
ORDER BY 
    ordinal_position;
