import axios from 'axios';
import supabase from './supabase.js';

/**
 * Bluesky Authentication Service
 * Uses AT Protocol for authentication
 * Unlike OAuth, Bluesky uses App Passwords for third-party access
 */

class BlueskyAuth {
  constructor() {
    this.apiUrl = 'https://bsky.social/xrpc';
  }

  /**
   * Authenticate with Bluesky using handle and app password
   * @param {string} identifier - Bluesky handle (e.g., user.bsky.social) or email
   * @param {string} password - App password (not main account password)
   * @returns {Object} Session with access token and DID
   */
  async authenticate(identifier, password) {
    try {
      console.log('\n🔵 Bluesky: Authenticating...');
      console.log('Identifier:', identifier);

      const response = await axios.post(
        `${this.apiUrl}/com.atproto.server.createSession`,
        {
          identifier,
          password
        }
      );

      const session = response.data;
      
      console.log('✅ Bluesky: Authentication successful');
      console.log('DID:', session.did);
      console.log('Handle:', session.handle);

      return {
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
        did: session.did,
        handle: session.handle,
        email: session.email,
        didDoc: session.didDoc
      };
    } catch (error) {
      console.error('❌ Bluesky authentication error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to authenticate with Bluesky. Please check your handle and app password.'
      );
    }
  }

  /**
   * Refresh the access token using refresh token
   * @param {string} refreshJwt - Refresh token
   * @returns {Object} New session tokens
   */
  async refreshSession(refreshJwt) {
    try {
      console.log('\n🔄 Bluesky: Refreshing session...');

      const response = await axios.post(
        `${this.apiUrl}/com.atproto.server.refreshSession`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${refreshJwt}`
          }
        }
      );

      const session = response.data;
      console.log('✅ Bluesky: Session refreshed');

      return {
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
        did: session.did,
        handle: session.handle
      };
    } catch (error) {
      console.error('❌ Bluesky session refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Bluesky session');
    }
  }

  /**
   * Get user profile information
   * @param {string} accessJwt - Access token
   * @param {string} actor - DID or handle
   * @returns {Object} Profile information
   */
  async getProfile(accessJwt, actor) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/app.bsky.actor.getProfile`,
        {
          params: { actor },
          headers: {
            'Authorization': `Bearer ${accessJwt}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching Bluesky profile:', error.response?.data || error.message);
      throw new Error('Failed to fetch Bluesky profile');
    }
  }

  /**
   * Store Bluesky credentials in database
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data from authentication
   */
  async storeCredentials(userId, sessionData) {
    try {
      console.log('\n💾 Storing Bluesky credentials for user:', userId);

      const { error } = await supabase
        .from('social_tokens')
        .upsert(
          {
            user_id: userId,
            provider: 'bluesky',
            access_token: sessionData.accessJwt,
            refresh_token: sessionData.refreshJwt,
            bluesky_did: sessionData.did,
            bluesky_handle: sessionData.handle,
            username: sessionData.handle,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,provider' }
        );

      if (error) throw error;

      console.log('✅ Bluesky credentials stored successfully');
    } catch (error) {
      console.error('❌ Error storing Bluesky credentials:', error);
      throw new Error('Failed to store Bluesky credentials');
    }
  }

  /**
   * Verify credentials are still valid
   * @param {string} accessJwt - Access token
   * @returns {boolean} True if valid
   */
  async verifyCredentials(accessJwt) {
    try {
      await axios.get(
        `${this.apiUrl}/com.atproto.server.getSession`,
        {
          headers: {
            'Authorization': `Bearer ${accessJwt}`
          }
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new BlueskyAuth();
