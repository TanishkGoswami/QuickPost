-- Migration: Fix contacts table unique constraint + RLS
-- Needed for upsert with onConflict to work correctly in automationEngine.ts
-- Also ensures service_role can insert/update contacts via Edge Functions

-- FIX 4: Add unique constraint on contacts (instagram_user_id, instagram_account_id)
-- This is required for upsert / onConflict to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contacts_instagram_user_id_account_id_key'
      AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_instagram_user_id_account_id_key
    UNIQUE (instagram_user_id, instagram_account_id);

    RAISE NOTICE 'Unique constraint added on contacts(instagram_user_id, instagram_account_id)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists, skipping';
  END IF;
END $$;

-- Ensure RLS policy allows insert/update for own user (via User ID match)
-- Service role bypasses RLS, so this is mainly for direct Supabase client calls

DROP POLICY IF EXISTS "Contacts modifiable by own user" ON public.contacts;
CREATE POLICY "Contacts modifiable by own user"
ON public.contacts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
