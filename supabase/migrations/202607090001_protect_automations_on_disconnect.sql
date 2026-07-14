-- Migration to change automations foreign key to ON DELETE SET NULL for safety
-- This ensures that even if an instagram_accounts row is hard deleted,
-- automations will be preserved (orphaned with NULL reference instead of destroyed).

ALTER TABLE public.automations 
  DROP CONSTRAINT IF EXISTS automations_ig_account_id_fkey,
  DROP CONSTRAINT IF EXISTS automations_instagram_account_id_fkey;

ALTER TABLE public.automations 
  ALTER COLUMN instagram_account_id DROP NOT NULL;

ALTER TABLE public.automations 
  ADD CONSTRAINT automations_instagram_account_id_fkey 
  FOREIGN KEY (instagram_account_id) 
  REFERENCES public.instagram_accounts(id) 
  ON DELETE SET NULL;
