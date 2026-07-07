import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllLogs() {
  const { data } = await supabase
    .from('webhook_logs')
    .select('id, event_type, processed, processing_error, created_at, payload')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('All recent webhook logs:', JSON.stringify(data, null, 2));
}

checkAllLogs();
