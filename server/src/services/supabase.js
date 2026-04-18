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
      bluesky: null
    };

    for (const row of data) {
      if (row.provider === 'instagram') {
        tokens.instagram = {
          accessToken: row.access_token,
          businessId: row.instagram_business_id,
          pageId: row.page_id,
          tokenExpiry: row.token_expiry
        };
      }

      if (row.provider === 'facebook') {
        tokens.facebook = {
          accessToken: row.access_token, // store PAGE access token here
          pageId: row.page_id,
          tokenExpiry: row.token_expiry
        };
      }

      if (row.provider === 'youtube') {
        tokens.youtube = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry
        };
      }

      if (row.provider === 'pinterest') {
        tokens.pinterest = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          tokenExpiry: row.token_expiry
        };
      }

      if (row.provider === 'bluesky') {
        tokens.bluesky = {
          accessToken: row.access_token,
          refreshToken: row.refresh_token,
          did: row.bluesky_did,
          handle: row.bluesky_handle,
          tokenExpiry: row.token_expiry
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
 */
export async function createOrUpdateUser(email, name, googleId = null, profilePicture = null) {
  try {
    // Try find by google_id first
    let existingUser = null;

    if (googleId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .maybeSingle();
      existingUser = data;
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

    if (googleId) updates.google_id = googleId;
    if (profilePicture) updates.profile_picture = profilePicture;

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

    const { data, error } = await supabase
      .from('users')
      .insert([{ ...updates, created_at: new Date().toISOString() }])
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
      .select('provider, updated_at, token_expiry, page_id, instagram_business_id, account_id, bluesky_did, bluesky_handle')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const providers = ['youtube', 'instagram', 'facebook', 'pinterest', 'bluesky', 'linkedin'];
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
        bluesky_handle: row.bluesky_handle || null
      };
    }

    return result;
  } catch (err) {
    console.error('💥 [SUPABASE] getConnectedAccounts error:', err?.message || err);
    // return safe default
    return {
      instagram: { connected: false },
      facebook: { connected: false },
      youtube: { connected: false },
      pinterest: { connected: false },
      bluesky: { connected: false }
    };
  }
}

export default supabase;
