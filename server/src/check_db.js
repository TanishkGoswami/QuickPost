import supabase from './services/supabase.js';

async function checkSchema() {
  try {
    // Try to select a non-existent column to see the error message
    const { data, error } = await supabase
      .from('social_tokens')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error selecting from social_tokens:', error.message);
    } else {
      console.log('✅ Successfully selected from social_tokens');
      if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
      } else {
        console.log('No data in social_tokens, cannot determine columns this way.');
      }
    }
    
    // Try to select 'username' specifically
    const { error: usernameError } = await supabase
      .from('social_tokens')
      .select('username')
      .limit(1);
      
    if (usernameError) {
      console.error('❌ Error selecting column "username":', usernameError.message);
    } else {
      console.log('✅ Column "username" exists!');
    }

  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkSchema();
