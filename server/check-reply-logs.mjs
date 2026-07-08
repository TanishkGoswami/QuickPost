import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchReplyLogs() {
  const { data } = await supabase
    .from('reply_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('Reply logs:', JSON.stringify(data, null, 2));
}

fetchReplyLogs();
