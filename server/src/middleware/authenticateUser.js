import { createClient } from '@supabase/supabase-js';
import { createOrUpdateUser } from '../services/supabase.js';

// Use Supabase admin client to verify tokens correctly.
// Supabase JWTs are signed with Supabase's own JWT secret, NOT process.env.JWT_SECRET.
// The only safe way to verify them server-side is via supabase.auth.getUser().
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

    const token = authHeader.substring(7);

    // ✅ Verify token via Supabase — works regardless of which JWT secret Supabase uses
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error?.message || 'Authentication token is invalid or expired'
      });
    }

    // Build user info from Supabase user object
    const userInfo = {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      profilePicture: user.user_metadata?.avatar_url || null
    };

    // Sync with public.users table (non-blocking — don't let this fail the request)
    try {
      await createOrUpdateUser(
        userInfo.email,
        userInfo.name,
        userInfo.userId,
        userInfo.profilePicture
      );
    } catch (syncError) {
      console.warn('⚠️ [AUTH] Failed to sync user to public.users:', syncError.message);
    }

    req.user = userInfo;
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
