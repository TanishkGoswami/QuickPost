import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Server-side should use SERVICE ROLE key (recommended)
// Fallback to ANON for local dev only (may fail with RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. Required: SUPABASE_URL and SUPABASE_SERVICE_KEY (recommended) or SUPABASE_ANON_KEY (dev only).'
  );
}

if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ You are using SUPABASE_ANON_KEY on the server. Some writes may fail due to RLS. Prefer SUPABASE_SERVICE_KEY.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch social media tokens for a user (all providers)
 * @param {string} userId
 * @returns {Object} { instagram, facebook, youtube, pinterest }
 */
export async function getTokensForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('social_tokens')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No tokens found for this user');

    const tokens = {
      instagram: null,
      facebook: null,
      youtube: null,
      pinterest: null,
      bluesky: null,
      linkedin: null,
      mastodon: null,

      x: null
    };

    for (const row of data) {
      if (row.provider === 'instagram') {
        tokens.instagram = {
          accessToken: row.access_token,
          businessId: row.instagram_business_id,
          pageId: row.page_id,
          tokenExpiry: row.token_expiry,
          username: row.username
        };
      }

      if (row.provider === 'facebook') {
        tokens.facebook = {
          accessToken: row.access_token, // store PAGE access token here
          pageId: row.page_id,
          tokenExpiry: row.token_expiry,
          username: row.username
        };
      }

      if (row.provider === 'youtube') {
        tokens.youtube = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry,
          username: row.username
        };
      }

      if (row.provider === 'pinterest') {
        tokens.pinterest = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry,
          username: row.username
        };
      }

      if (row.provider === 'bluesky') {
        tokens.bluesky = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          did: row.bluesky_did,
          handle: row.bluesky_handle,
          tokenExpiry: row.token_expiry,
          username: row.username
        };
      }

      if (row.provider === 'linkedin') {
        tokens.linkedin = {
          accessToken: row.access_token,
          profileData: row.profile_data,
          tokenExpiry: row.expires_at,
          username: row.username
        };
      }

      if (row.provider === 'mastodon') {
        tokens.mastodon = {
          accessToken: row.access_token,
          instanceUrl: row.mastodon_instance,
          profileData: row.profile_data,
          username: row.username
        };
      }



      if (row.provider === 'threads') {
        tokens.threads = {
          accessToken: row.access_token,
          account_id: row.account_id,
          username: row.username
        };
      }
      
      if (row.provider === 'x') {
        tokens.x = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry,
          accountId: row.account_id,
          username: row.username
        };
      }

      if (row.provider === 'reddit') {
        tokens.reddit = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry,
          accountId: row.account_id,
          username: row.username
        };
      }
    }

    return tokens;
  } catch (err) {
    console.error('💥 [SUPABASE] getTokensForUser error:', err?.message || err);
    throw new Error(`Failed to fetch tokens: ${err.message || err}`);
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('User not found');
  return data;
}

/**
 * Create or update user
 * @param {string} email
 * @param {string} name
 * @param {string} externalId - Can be Google ID or Supabase UUID
 * @param {string} profilePicture
 */
export async function createOrUpdateUser(email, name, externalId = null, profilePicture = null) {
  try {
    let existingUser = null;

    // Try find by externalId (which we now store as id or google_id)
    if (externalId) {
      // First try to match the ID directly (for Supabase UUIDs)
      const { data: byId } = await supabase
        .from('users')
        .select('*')
        .eq('id', externalId)
        .maybeSingle();
      
      if (byId) {
        existingUser = byId;
      } else {
        // Then try by google_id (legacy)
        const { data: byGoogleId } = await supabase
          .from('users')
          .select('*')
          .eq('google_id', externalId)
          .maybeSingle();
        existingUser = byGoogleId;
      }
    }

    // Fallback by email
    if (!existingUser && email) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existingUser = data;
    }

    const updates = {
      email,
      name,
      updated_at: new Date().toISOString()
    };

    if (profilePicture) updates.profile_picture = profilePicture;
    
    // If it looks like a Google ID (numeric string), put it in google_id
    if (externalId && /^\d+$/.test(externalId)) {
      updates.google_id = externalId;
    }

    if (existingUser) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // New user
    const newUser = { ...updates, created_at: new Date().toISOString() };
    
    // If we have a UUID from Supabase, use it as the primary key
    if (externalId && externalId.length > 20 && externalId.includes('-')) {
      newUser.id = externalId;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('💥 [SUPABASE] createOrUpdateUser error:', err?.message || err);
    throw new Error(`Failed to create/update user: ${err.message || err}`);
  }
}

/**
 * Get connected accounts for a user (returns metadata)
 * Compatible with your /auth/accounts endpoint
 */
export async function getConnectedAccounts(userId) {
  try {
    const { data, error } = await supabase
      .from('social_tokens')
      .select('provider, updated_at, token_expiry, page_id, instagram_business_id, account_id, bluesky_did, bluesky_handle, profile_data, mastodon_instance, username')
      .eq('user_id', userId);

    console.log(`\n📊 [SUPABASE] Raw social_tokens for user ${userId}:`, data?.map(d => d.provider));

    if (error) {
       console.error('💥 [SUPABASE] getConnectedAccounts query error:', error.message);
       // If it's a "column does not exist" error, we still want to return what we have (nothing) 
       // but we shouldn't throw a generic error that hides everything else if we can help it.
    }

    const providers = ['youtube', 'instagram', 'facebook', 'pinterest', 'bluesky', 'linkedin', 'mastodon', 'threads', 'x', 'reddit'];
    const result = {};
    for (const p of providers) result[p] = { connected: false };

    for (const row of data || []) {
      result[row.provider] = {
        connected: true,
        updated_at: row.updated_at,
        token_expiry: row.token_expiry,
        page_id: row.page_id || null,
        instagram_business_id: row.instagram_business_id || null,
        account_id: row.account_id || null,
        bluesky_did: row.bluesky_did || null,
        bluesky_handle: row.bluesky_handle || null,
        username: row.username || null
      };
    }

    console.log(`✅ [SUPABASE] Final connected status:`, Object.keys(result).filter(k => result[k].connected));
    return result;
  } catch (err) {
    console.error('💥 [SUPABASE] getConnectedAccounts unexpected error:', err?.message || err);
    // return safe default only on catastrophic failure
    return {
      instagram: { connected: false },
      facebook: { connected: false },
      youtube: { connected: false },
      pinterest: { connected: false },
      bluesky: { connected: false },
      linkedin: { connected: false },
      mastodon: { connected: false },

      threads: { connected: false },
      x: { connected: false },
      reddit: { connected: false }
    };
  }
}

export default supabase;
