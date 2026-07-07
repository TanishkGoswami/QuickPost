import { listAccounts } from './server/src/services/instapilot.js';
import supabase from './server/src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function run() {
  try {
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || !users.length) {
      console.log('No users found');
      return;
    }
    const userId = users[0].id;
    console.log('Testing listAccounts for user', userId);
    const accounts = await listAccounts(userId);
    console.log('Accounts:', accounts);
  } catch (err) {
    console.error('Error listAccounts:', err);
  }
}
run();
