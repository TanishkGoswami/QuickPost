import { createClient } from '@supabase/supabase-js';
import { createOrUpdateUser } from '../services/supabase.js';

const supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey || supabaseKey.startsWith('ROTATE_ME')) {
  supabaseKey = process.env.SUPABASE_ANON_KEY;
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function isUsableBearerToken(token) {
  return (
    typeof token === 'string' &&
    token.trim() &&
    token !== 'null' &&
    token !== 'undefined' &&
    token.split('.').length === 3
  );
}

/**
 * Authentication middleware
 * Verifies Supabase JWT via supabase.auth.getUser() — this is the ONLY correct approach.
 * Using jwt.verify() with a custom secret will always fail against Supabase tokens.
 */
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7).trim();
    if (!isUsableBearerToken(token)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No valid authentication token provided'
      });
    }

    // ✅ Verify token via Supabase — works regardless of which JWT secret Supabase uses
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('❌ [AUTH] Token verification failed:', error?.message || 'No user found');
      if (error) console.error('Full error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error?.message || 'Authentication token is invalid or expired'
      });
    }


    // Build user info from Supabase user object
    const userInfo = {
      userId: user.id,
      authUserId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      profilePicture: user.user_metadata?.avatar_url || null
    };

    // Sync with public.users table (important for identity consistency)
    try {
      const dbUser = await createOrUpdateUser(
        userInfo.email,
        userInfo.name,
        userInfo.userId,
        userInfo.profilePicture
      );
      
      // ✅ IMPORTANT: Use the ID from our database record.
      // If a user has multiple identity providers (Google, Email) for the same email,
      // Supabase gives them different internal IDs, but we want to map them to the same
      // record in our public.users table.
      if (dbUser && dbUser.id) {
        userInfo.userId = dbUser.id;
      }
    } catch (syncError) {
      console.warn('⚠️ [AUTH] Failed to sync user to public.users:', syncError.message);
    }

    req.user = userInfo;
    req.token = token;
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Generate JWT token (Legacy support)
 */
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
