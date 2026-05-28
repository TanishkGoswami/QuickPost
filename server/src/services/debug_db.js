import supabase from './supabase.js';

async function run() {
  try {
    console.log('--- Users Table Debug ---');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, google_id');
    if (error) {
      console.error('Error querying users:', error);
    } else {
      console.log('Users count:', users.length);
      console.log('Users:', JSON.stringify(users, null, 2));
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
