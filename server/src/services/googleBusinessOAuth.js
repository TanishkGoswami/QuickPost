import axios from "axios";
import { google } from "googleapis";
import supabase from "./supabase.js";

const GOOGLE_BUSINESS_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Google Business OAuth Service
 * Handles Google Business Profile authentication via Google OAuth 2.0
 */
function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

class GoogleBusinessOAuthService {
  constructor() {}

  createClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
        `${process.env.SERVER_PUBLIC_URL || "http://localhost:5000"}/api/auth/googleBusiness/callback`,
    );
  }

  makeState(userId) {
    return base64urlEncode({
      userId,
      provider: "googleBusiness",
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
      scope: GOOGLE_BUSINESS_SCOPES,
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

      // For Google Business, we need to fetch the Account ID and Location ID
      // 1. Get Accounts
      let accountId = null;
      let locationId = null;
      let businessName = userInfo.name;

      try {
        const accountsRes = await axios.get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        
        if (accountsRes.data.accounts && accountsRes.data.accounts.length > 0) {
          // Use the first account
          const account = accountsRes.data.accounts[0];
          accountId = account.name; // usually "accounts/12345"
          
          // 2. Get Locations for this account
          const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
            params: { readMask: "name,title" } // We just need name (ID) and title
          });

          if (locationsRes.data.locations && locationsRes.data.locations.length > 0) {
            const location = locationsRes.data.locations[0];
            locationId = location.name; // usually "accounts/12345/locations/67890"
            businessName = location.title;
          }
        }
      } catch (apiErr) {
        console.warn("⚠️ [GOOGLE_BUSINESS_OAUTH] Failed to fetch accounts/locations:", apiErr.response?.data || apiErr.message);
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
          username: businessName,
          accountId,
          locationId
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
        .eq("provider", "googleBusiness")
        .eq("account_id", tokenData.userInfo?.locationId || tokenData.userInfo?.accountId || tokenData.userInfo?.googleId)
        .maybeSingle();

      if (existingError) {
        console.warn(
          "⚠️ [GOOGLE_BUSINESS_OAUTH] Failed to read existing Google Business token row:",
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
            provider: "googleBusiness",
            access_token: tokenData.accessToken,
            refresh_token: resolvedRefreshToken,
            token_expiry: resolvedExpiry,
            account_id: tokenData.userInfo?.locationId || tokenData.userInfo?.accountId || tokenData.userInfo?.googleId,
            username: resolvedUsername,
            profile_data: resolvedProfileData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,provider,account_id",
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
      console.log("🔄 [GOOGLE_BUSINESS_OAUTH] Refreshing access token...");
      const client = this.createClient();
      client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await client.refreshAccessToken();
      console.log("✅ [GOOGLE_BUSINESS_OAUTH] Access token refreshed");

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Detailed error for the user
      const isInvalidGrant = error.response?.data?.error === 'invalid_grant' || error.message?.includes('invalid_grant');
      const message = isInvalidGrant 
        ? "Google Business connection expired. Please reconnect your account."
        : `Failed to refresh Google Business access token: ${error.message}`;
      throw new Error(message);
    }
  }

  /**
   * Get valid access token (refresh if expired)
   * @param {string} userId - User's UUID
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken(userId, accountId = null) {
    try {
      console.log(
        `🔍 [GOOGLE_BUSINESS_OAUTH] Fetching tokens for user ${userId} from DB...`,
      );
      let query = supabase
        .from("social_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "googleBusiness");
      if (accountId) query = query.eq("id", accountId);
      const { data, error } = await query.limit(1).single();
      console.log("✅ [GOOGLE_BUSINESS_OAUTH] DB fetch complete. Token found:", !!data);

      if (error || !data) {
        throw new Error("Google Business account not connected");
      }

      const now = new Date();
      const expiry = data.token_expiry ? new Date(data.token_expiry) : null;
      const hasUsableAccessToken = Boolean(data.access_token);
      const hasRefreshToken = Boolean(data.refresh_token);
      const isExpiryValid = expiry && !Number.isNaN(expiry.getTime());

      // If token expires in less than 5 minutes, refresh it
      if (!hasUsableAccessToken) {
        throw new Error("Google Business account not connected");
      }

      if (!isExpiryValid) {
        console.warn(
          "⚠️ [GOOGLE_BUSINESS_OAUTH] Missing/invalid Google Business token expiry, using stored access token",
        );
        return data.access_token;
      }

      if (expiry - now < 5 * 60 * 1000) {
        if (!hasRefreshToken) {
          throw new Error(
            "Google Business connection expired. Please reconnect your account.",
          );
        }

        console.log("Token expired or expiring soon, refreshing...");
        const refreshed = await this.refreshAccessToken(data.refresh_token);

        await supabase
          .from("social_tokens")
          .update({
            access_token: refreshed.accessToken,
            token_expiry: refreshed.expiryDate
              ? new Date(refreshed.expiryDate).toISOString()
              : data.token_expiry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .eq("user_id", userId);

        return refreshed.accessToken;
      }

      return data.access_token;
    } catch (error) {
      console.error("Error getting valid access token:", error);
      throw error;
    }
  }
}

export default new GoogleBusinessOAuthService();
