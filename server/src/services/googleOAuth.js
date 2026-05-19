import axios from "axios";
import { google } from "googleapis";
import supabase from "./supabase.js";

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Google OAuth Service
 * Handles YouTube authentication via Google OAuth 2.0
 */
function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

class GoogleOAuthService {
  constructor() {}

  createClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5000/api/auth/google/callback",
    );
  }

  makeState(userId) {
    return base64urlEncode({
      userId,
      provider: "youtube",
      nonce: Math.random().toString(36).substring(7),
      ts: Date.now(),
    });
  }

  /**
   * Generate Google OAuth authorization URL
   * @param {string} state - Base64 encoded state object
   */
  getAuthorizationUrl(state) {
    const client = this.createClient();
    const authUrl = client.generateAuthUrl({
      access_type: "offline", // Request refresh token
      scope: YOUTUBE_SCOPES,
      prompt: "consent", // Force consent screen to get refresh token
      state,
    });
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} User info and tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const client = this.createClient();
      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const { data: userInfo } = await oauth2.userinfo.get();

      // Get YouTube Channel info (to get the channel name/handle)
      const youtube = google.youtube({
        version: "v3",
        auth: client,
      });
      let channelTitle = userInfo.name; // Fallback to Google name
      try {
        const channelRes = await youtube.channels.list({
          part: "snippet",
          mine: true,
        });
        if (channelRes.data.items && channelRes.data.items.length > 0) {
          channelTitle = channelRes.data.items[0].snippet.title;
        }
      } catch (err) {
        console.warn(
          "⚠️ [GOOGLE_OAUTH] Failed to fetch YT channel info:",
          err.message,
        );
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        userInfo: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.id,
          username: channelTitle,
        },
      };
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw new Error("Failed to authenticate with Google");
    }
  }

  /**
   * Store or update Google/YouTube tokens in Supabase
   * @param {string} userId - User's UUID
   * @param {Object} tokenData - Token information
   */
  async storeTokens(userId, tokenData) {
    try {
      const { data: existingRow, error: existingError } = await supabase
        .from("social_tokens")
        .select("refresh_token, username, profile_data, token_expiry")
        .eq("user_id", userId)
        .eq("provider", "youtube")
        .maybeSingle();

      if (existingError) {
        console.warn(
          "⚠️ [GOOGLE_OAUTH] Failed to read existing YouTube token row:",
          existingError.message,
        );
      }

      const expiryDate = tokenData.expiryDate
        ? new Date(tokenData.expiryDate)
        : null;
      const resolvedRefreshToken =
        tokenData.refreshToken ?? existingRow?.refresh_token ?? null;
      const resolvedUsername =
        tokenData.userInfo?.username ?? existingRow?.username ?? null;
      const resolvedProfileData =
        tokenData.userInfo ?? existingRow?.profile_data ?? null;
      const resolvedExpiry =
        expiryDate && !Number.isNaN(expiryDate.getTime())
          ? expiryDate.toISOString()
          : existingRow?.token_expiry ?? null;

      const { data, error } = await supabase
        .from("social_tokens")
        .upsert(
          {
            user_id: userId,
            provider: "youtube",
            access_token: tokenData.accessToken,
            refresh_token: resolvedRefreshToken,
            token_expiry: resolvedExpiry,
            username: resolvedUsername,
            profile_data: resolvedProfileData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,provider",
          },
        )
        .select();

      if (error) {
        console.error("Supabase error storing tokens:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error storing tokens:", error);
      throw new Error("Failed to store authentication tokens");
    }
  }

  /**
   * Refresh expired access token
   * @param {string} refreshToken - Google refresh token
   * @returns {Promise<Object>} New access token and expiry
   */
  async refreshAccessToken(refreshToken) {
    try {
      console.log("🔄 [GOOGLE_OAUTH] Refreshing access token...");
      const client = this.createClient();
      client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await client.refreshAccessToken();
      console.log("✅ [GOOGLE_OAUTH] Access token refreshed");

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Detailed error for the user
      const isInvalidGrant = error.response?.data?.error === 'invalid_grant' || error.message?.includes('invalid_grant');
      const message = isInvalidGrant 
        ? "YouTube connection expired. Please reconnect your YouTube account."
        : `Failed to refresh YouTube access token: ${error.message}`;
      throw new Error(message);
    }
  }

  /**
   * Get valid access token (refresh if expired)
   * @param {string} userId - User's UUID
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken(userId) {
    try {
      console.log(
        `🔍 [GOOGLE_OAUTH] Fetching tokens for user ${userId} from DB...`,
      );
      const { data, error } = await supabase
        .from("social_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "youtube")
        .single();
      console.log("✅ [GOOGLE_OAUTH] DB fetch complete. Token found:", !!data);

      if (error || !data) {
        throw new Error("YouTube account not connected");
      }

      const now = new Date();
      const expiry = data.token_expiry ? new Date(data.token_expiry) : null;
      const hasUsableAccessToken = Boolean(data.access_token);
      const hasRefreshToken = Boolean(data.refresh_token);
      const isExpiryValid = expiry && !Number.isNaN(expiry.getTime());

      // If token expires in less than 5 minutes, refresh it
      if (!hasUsableAccessToken) {
        throw new Error("YouTube account not connected");
      }

      if (!isExpiryValid) {
        console.warn(
          "⚠️ [GOOGLE_OAUTH] Missing/invalid YouTube token expiry, using stored access token",
        );
        return data.access_token;
      }

      if (expiry - now < 5 * 60 * 1000) {
        if (!hasRefreshToken) {
          throw new Error(
            "YouTube connection expired. Please reconnect your YouTube account.",
          );
        }

        console.log("Token expired or expiring soon, refreshing...");
        const refreshed = await this.refreshAccessToken(data.refresh_token);

        // Update token in database
        await this.storeTokens(userId, {
          accessToken: refreshed.accessToken,
          refreshToken: data.refresh_token,
          expiryDate: refreshed.expiryDate,
        });

        return refreshed.accessToken;
      }

      return data.access_token;
    } catch (error) {
      console.error("Error getting valid access token:", error);
      throw error;
    }
  }
}

export default new GoogleOAuthService();
