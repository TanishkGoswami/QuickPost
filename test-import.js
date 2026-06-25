import { importConnectedInstagram } from './server/src/services/instapilot.js';
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
    console.log('Testing importConnectedInstagram for user', userId);
    // Since instapilot functions often expect req.user object format, we mock it
    const result = await importConnectedInstagram({ userId: userId });
    console.log('Result:', result);
  } catch (err) {
    console.error('Error importConnectedInstagram:', err);
  }
}
run();
