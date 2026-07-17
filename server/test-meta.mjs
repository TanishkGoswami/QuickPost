import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

dotenv.config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApi() {
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('access_token')
    .eq('ig_id', '26502131352780274')
    .single();

  if (!account) return console.log('Account not found');
  
  // Actually, wait, access_token in DB is encrypted. We need tokenService.ts to decrypt it.
  // Instead, let's just write a deno script and run it locally with `deno run`!
}

testApi();
