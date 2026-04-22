import jwt from 'jsonwebtoken';
import { createOrUpdateUser } from '../services/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header (Supabase JWT)
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

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Map Supabase fields
      const userInfo = {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.user_metadata?.full_name || decoded.email?.split('@')[0],
        profilePicture: decoded.user_metadata?.avatar_url || null
      };

      // Sync with public.users table to ensure social tokens can be linked
      try {
        await createOrUpdateUser(
          userInfo.email,
          userInfo.name,
          userInfo.userId, // We pass the sub as the primary key/link
          userInfo.profilePicture
        );
      } catch (syncError) {
        console.warn('⚠️ [AUTH] Failed to sync user to public.users:', syncError.message);
        // We continue anyway, as the JWT is valid
      }

      req.user = {
        ...userInfo,
        ...decoded
      };
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }
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
 * Generate JWT token (Legacy support, may not be needed with Supabase)
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
