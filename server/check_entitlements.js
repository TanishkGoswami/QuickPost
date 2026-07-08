import dotenv from 'dotenv';
import supabase from './src/services/supabase.js';

dotenv.config();

const email = 'getaipilott@gmail.com';

async function run() {
  try {
    // Query users table
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    console.log('Users in public.users:', JSON.stringify(users, null, 2), 'Error:', uErr?.message);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
