import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import googleOAuth from "../services/googleOAuth.js";
import instagramOAuth from "../services/instagramOAuth.js";
import pinterestOAuth from "../services/pinterestOAuth.js";
import facebookOAuth from "../services/facebookOAuth.js";
import blueskyAuth from "../services/blueskyAuth.js";
import linkedinOAuth from "../services/linkedinOAuth.js";
import mastodonOAuth from "../services/mastodonOAuth.js";

import threadsOAuth from "../services/threadsOAuth.js";
import xOAuth from "../services/xOAuth.js";
import redditOAuth from "../services/redditOAuth.js";

import supabase, {
  createOrUpdateUser,
  getConnectedAccounts,
} from "../services/supabase.js";
import {
  authenticateUser,
  generateToken,
} from "../middleware/authenticateUser.js";

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

function decodeState(state) {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
  } catch (e) {
    return null;
  }
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET missing in env");
  }
}
requireJwtSecret();

/* ---------------- GOOGLE ---------------- */

router.get("/google", (req, res) => {
  try {
    const authUrl = googleOAuth.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth init error:", error);
    res.redirect(`${CLIENT_URL}/login?error=google_oauth_failed`);
  }
});

router.get("/youtube", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] YouTube init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      // Sync user and get consistent ID
      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;

      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = googleOAuth.makeState(userId);
    const authUrl = googleOAuth.getAuthorizationUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    console.error("YouTube OAuth init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=youtube_oauth_failed`);
  }
});

router.post("/youtube/auto-connect", authenticateUser, async (req, res) => {
  try {
    const { providerAccessToken, providerRefreshToken, providerTokenExpiry } =
      req.body || {};

    if (!providerAccessToken) {
      return res.status(400).json({
        success: false,
        error: "providerAccessToken is required",
      });
    }

    const tokenData = await googleOAuth.buildTokenDataFromProviderTokens({
      accessToken: providerAccessToken,
      refreshToken: providerRefreshToken || null,
      expiryDate: providerTokenExpiry || null,
    });

    await googleOAuth.storeTokens(req.user.userId, tokenData);

    return res.json({
      success: true,
      message: "YouTube connected automatically via Google sign-in",
      username: tokenData.userInfo?.username || null,
    });
  } catch (error) {
    console.error("Auto YouTube connect error:", error);
    
    // Check if it's a token verification error
    if (error.message?.includes('invalid') || error.message?.includes('Failed to build YouTube token')) {
       return res.status(401).json({
         success: false,
         error: "Your Google session has expired. Please try connecting YouTube manually.",
         details: error.message
       });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to auto-connect YouTube",
      message: error.message
    });
  }
});

router.get("/google/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) return res.redirect(`${CLIENT_URL}/login?error=access_denied`);
  if (!code) return res.redirect(`${CLIENT_URL}/login?error=no_code`);

  try {
    const decodedState = decodeState(state);
    const tokenData = await googleOAuth.exchangeCodeForTokens(code);

    if (decodedState && decodedState.userId) {
      // This is a CONNECTION flow
      console.log(
        "🔗 [AUTH] Connecting YouTube account for user:",
        decodedState.userId,
      );
      await googleOAuth.storeTokens(decodedState.userId, tokenData);
      return res.redirect(`${CLIENT_URL}/dashboard?success=youtube`);
    }

    // This is a LOGIN flow
    const user = await createOrUpdateUser(
      tokenData.userInfo.email,
      tokenData.userInfo.name,
      tokenData.userInfo.googleId,
      tokenData.userInfo.picture,
    );

    await googleOAuth.storeTokens(user.id, tokenData);

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.redirect(
      `${CLIENT_URL}/auth/callback?token=${jwtToken}&provider=google`,
    );
  } catch (err) {
    console.error("Google callback error:", err);
    res.redirect(`${CLIENT_URL}/login?error=authentication_failed`);
  }
});

/* ---------------- INSTAGRAM ---------------- */

router.get("/instagram", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] Instagram init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = instagramOAuth.makeState(userId);
    const authUrl = instagramOAuth.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Instagram init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=instagram_oauth_failed`);
  }
});

router.get("/instagram/callback", async (req, res) => {
  const { code, error, state } = req.query;

  console.log("\n🔵 Instagram OAuth Callback Received");
  console.log("Query params:", {
    code: code ? "present" : "missing",
    error,
    state: state ? "present" : "missing",
  });

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await instagramOAuth.exchangeCodeForToken(code);
    await instagramOAuth.storeTokens(parsed.userId, tokenData);

    res.redirect(`${CLIENT_URL}/dashboard?success=instagram_connected`);
  } catch (err) {
    console.error("❌ IG callback error:", err.message);
    res.redirect(`${CLIENT_URL}/dashboard?error=instagram_connection_failed`);
  }
});

/* ---------------- FACEBOOK ---------------- */

router.get("/facebook", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] Facebook init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = facebookOAuth.makeState(userId);
    const authUrl = facebookOAuth.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Facebook init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=facebook_oauth_failed`);
  }
});

router.get("/facebook/callback", async (req, res) => {
  const { code, error, state } = req.query;

  console.log("\n🔵 Facebook OAuth Callback Received");
  console.log("Query params:", {
    code: code ? "present" : "missing",
    error,
    state: state ? "present" : "missing",
  });

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await facebookOAuth.exchangeCodeForToken(code);
    await facebookOAuth.storeTokens(parsed.userId, tokenData);

    res.redirect(`${CLIENT_URL}/dashboard?success=facebook_connected`);
  } catch (err) {
    console.error("❌ FB callback error:", err.message);
    res.redirect(`${CLIENT_URL}/dashboard?error=facebook_connection_failed`);
  }
});

/* ---------------- PINTEREST ---------------- */

router.get("/pinterest", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] Pinterest init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = Buffer.from(
      JSON.stringify({
        userId,
        provider: "pinterest",
        nonce: crypto.randomUUID(),
        ts: Date.now(),
      }),
    ).toString("base64url");
    const authUrl = pinterestOAuth.getAuthorizationUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    console.error("Pinterest init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=pinterest_oauth_failed`);
  }
});

router.get("/pinterest/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await pinterestOAuth.exchangeCodeForToken(code);
    await pinterestOAuth.storeTokens(parsed.userId, tokenData);

    res.redirect(`${CLIENT_URL}/dashboard?success=pinterest_connected`);
  } catch (err) {
    console.error("Pinterest callback error:", err);
    res.redirect(`${CLIENT_URL}/dashboard?error=pinterest_connection_failed`);
  }
});

/* ---------------- BLUESKY ---------------- */

// Bluesky uses a different auth flow - handle and app password
router.post("/bluesky/connect", authenticateUser, async (req, res) => {
  try {
    const { handle, appPassword } = req.body;
    const userId = req.user.userId;

    if (!handle || !appPassword) {
      return res.status(400).json({
        success: false,
        error: "Bluesky handle and app password are required",
      });
    }

    console.log("\n🔵 Bluesky: Connecting account...");
    console.log("User ID:", userId);
    console.log("Handle:", handle);

    // Authenticate with Bluesky
    const sessionData = await blueskyAuth.authenticate(handle, appPassword);

    // Store credentials
    await blueskyAuth.storeCredentials(userId, sessionData);

    res.json({
      success: true,
      message: "Bluesky account connected successfully",
      handle: sessionData.handle,
    });
  } catch (error) {
    console.error("❌ Bluesky connect error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to connect Bluesky account",
    });
  }
});

/* ---------------- LINKEDIN ---------------- */

router.get("/linkedin", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] LinkedIn init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = linkedinOAuth.makeState(userId);
    const authUrl = linkedinOAuth.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    console.error("LinkedIn init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=linkedin_oauth_failed`);
  }
});

router.get("/linkedin/callback", async (req, res) => {
  const { code, error, state } = req.query;

  console.log("\n🔵 LinkedIn OAuth Callback Received");
  console.log("Query params:", {
    code: code ? "present" : "missing",
    error,
    state: state ? "present" : "missing",
  });

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await linkedinOAuth.exchangeCodeForToken(code);
    await linkedinOAuth.storeTokens(parsed.userId, tokenData);

    res.redirect(`${CLIENT_URL}/dashboard?success=linkedin_connected`);
  } catch (err) {
    console.error("❌ LinkedIn callback error:", err.message);
    res.redirect(`${CLIENT_URL}/dashboard?error=linkedin_connection_failed`);
  }
});

/* ---------------- MASTODON ---------------- */

router.post("/mastodon/init", authenticateUser, async (req, res) => {
  try {
    const { instanceUrl } = req.body;
    const userId = req.user.userId;

    if (!instanceUrl) {
      return res
        .status(400)
        .json({ success: false, error: "Instance URL is required" });
    }

    // 1. Register app on the instance
    const registration = await mastodonOAuth.registerApp(instanceUrl);

    // 2. Create state with all needed info
    const state = mastodonOAuth.makeState(
      userId,
      instanceUrl,
      registration.clientId,
      registration.clientSecret,
    );

    // 3. Return the auth URL
    const authUrl = mastodonOAuth.getAuthorizationUrl(
      instanceUrl,
      registration.clientId,
      state,
    );

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error("Mastodon init error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/mastodon/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (
    !parsed?.userId ||
    !parsed?.instanceUrl ||
    !parsed?.clientId ||
    !parsed?.clientSecret
  ) {
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);
  }

  try {
    const tokenData = await mastodonOAuth.exchangeCodeForToken(
      parsed.instanceUrl,
      parsed.clientId,
      parsed.clientSecret,
      code,
    );

    await mastodonOAuth.storeTokens(
      parsed.userId,
      parsed.instanceUrl,
      tokenData,
    );

    res.redirect(`${CLIENT_URL}/dashboard?success=mastodon_connected`);
  } catch (err) {
    console.error("❌ Mastodon callback error:", err.message);
    res.redirect(`${CLIENT_URL}/dashboard?error=mastodon_connection_failed`);
  }
});



/* ---------------- THREADS ---------------- */

router.get("/threads", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] Threads init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = threadsOAuth.makeState(userId);
    const authUrl = threadsOAuth.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Threads init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=threads_oauth_failed`);
  }
});

router.get("/threads/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await threadsOAuth.exchangeCodeForToken(code);
    await threadsOAuth.storeTokens(parsed.userId, tokenData);

    console.log(
      `✅ [AUTH] Threads connected successfully for user ${parsed.userId}`,
    );
    res.redirect(`${CLIENT_URL}/dashboard?success=threads_connected`);
  } catch (err) {
    console.error("❌ Threads callback error:", err.message);
    res.redirect(
      `${CLIENT_URL}/dashboard?error=threads_connection_failed&message=${encodeURIComponent(err.message)}`,
    );
  }
});

/* ---------------- 𝕏 (TWITTER) ---------------- */

router.get("/x", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] X init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    // X requires PKCE. We'll generate a verifier and challenge.
    // Since we don't have sessions, we'll encode the verifier into the state.
    const { verifier, challenge } = xOAuth.generatePKCE();

    // Create state object with verifier
    const stateObj = {
      userId,
      provider: "x",
      codeVerifier: verifier, // Store verifier here to use in callback
      nonce: crypto.randomUUID(),
      ts: Date.now(),
    };

    const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");
    const authUrl = xOAuth.getAuthorizationUrl(state, challenge);

    return res.redirect(authUrl);
  } catch (error) {
    console.error("X init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=x_oauth_failed`);
  }
});

router.get("/x/callback", async (req, res) => {
  const { code, error, state } = req.query;

  console.log("\n🔵 X OAuth Callback Received");
  console.log(
    " - Code:",
    code ? "***" + code.substring(code.length - 5) : "MISSING",
  );
  console.log(" - State:", state ? "PRESENT" : "MISSING");
  console.log(" - Error:", error || "NONE");

  if (error) {
    console.error("❌ X OAuth Error from provider:", error);
    return res.redirect(
      `${CLIENT_URL}/dashboard?error=access_denied&details=${error}`,
    );
  }
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId || !parsed?.codeVerifier) {
    console.error("❌ X callback error: invalid state or missing verifier");
    console.log(" - Parsed State:", parsed);
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);
  }

  console.log(" - Verifier retrieved:", parsed.codeVerifier ? "YES" : "NO");

  try {
    const tokenData = await xOAuth.exchangeCodeForTokens(
      code,
      parsed.codeVerifier,
    );
    console.log(" - Token exchange success!");
    await xOAuth.storeTokens(parsed.userId, tokenData);

    console.log(`✅ [AUTH] X connected successfully for user ${parsed.userId}`);
    res.redirect(`${CLIENT_URL}/dashboard?success=x_connected`);
  } catch (err) {
    console.error("❌ X callback error:", err.message);
    res.redirect(
      `${CLIENT_URL}/dashboard?error=x_connection_failed&message=${encodeURIComponent(err.message)}`,
    );
  }
});

/* ---------------- REDDIT ---------------- */

router.get("/reddit", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.redirect(`${CLIENT_URL}/dashboard?error=missing_token`);

    let userId;
    try {
      console.log(
        `\n🔵 [AUTH] Reddit init for token: ${token?.substring(0, 20)}...`,
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw error || new Error("User not found");

      const dbUser = await createOrUpdateUser(
        user.email,
        user.user_metadata?.full_name || user.email?.split("@")[0],
        user.id,
        user.user_metadata?.avatar_url,
      );
      userId = dbUser.id;
      console.log(`✅ [AUTH] Token verified and synced for user: ${userId}`);
    } catch (e) {
      console.error("❌ [AUTH] Token verification failed:", e.message);
      return res.redirect(
        `${CLIENT_URL}/dashboard?error=invalid_token&details=${encodeURIComponent(e.message)}`,
      );
    }

    const state = redditOAuth.makeState(userId);
    const authUrl = redditOAuth.getAuthorizationUrl(state);
    return res.redirect(authUrl);
  } catch (error) {
    console.error("Reddit init error:", error);
    res.redirect(`${CLIENT_URL}/dashboard?error=reddit_oauth_failed`);
  }
});

router.get("/reddit/callback", async (req, res) => {
  const { code, error, state } = req.query;

  if (error) return res.redirect(`${CLIENT_URL}/dashboard?error=access_denied`);
  if (!code || !state)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_callback`);

  const parsed = decodeState(state);
  if (!parsed?.userId)
    return res.redirect(`${CLIENT_URL}/dashboard?error=invalid_state`);

  try {
    const tokenData = await redditOAuth.exchangeCodeForToken(code);
    await redditOAuth.storeTokens(parsed.userId, tokenData);

    console.log(
      `✅ [AUTH] Reddit connected successfully for user ${parsed.userId}`,
    );
    res.redirect(`${CLIENT_URL}/dashboard?success=reddit_connected`);
  } catch (err) {
    console.error("❌ Reddit callback error:", err.message);
    res.redirect(
      `${CLIENT_URL}/dashboard?error=reddit_connection_failed&message=${encodeURIComponent(err.message)}`,
    );
  }
});

// LinkedIn manual connection with access token
router.post("/linkedin/connect", authenticateUser, async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userId = req.user.userId;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "LinkedIn access token is required",
      });
    }

    console.log("\n🔵 LinkedIn: Connecting account with manual token...");
    console.log("User ID:", userId);

    // Get user info from LinkedIn API
    const userInfo = await linkedinOAuth.getUserProfile(accessToken);

    // Store tokens
    await linkedinOAuth.storeTokens(userId, {
      accessToken,
      expiresIn: 5184000, // 60 days default
      userInfo,
    });

    res.json({
      success: true,
      message: "LinkedIn account connected successfully",
      name: userInfo.name,
    });
  } catch (error) {
    console.error("❌ LinkedIn connect error:", error);
    res.status(500).json({
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to connect LinkedIn account",
    });
  }
});

/* ---------------- PINTEREST MANUAL CONNECT ---------------- */

// Pinterest manual connection with access token
router.post("/pinterest/connect", authenticateUser, async (req, res) => {
  try {
    const { accessToken, boardId } = req.body;
    const userId = req.user.userId;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Pinterest access token is required",
      });
    }

    console.log("\n📌 Pinterest: Connecting account with manual token...");
    console.log("User ID:", userId);
    console.log("Token preview:", accessToken.substring(0, 20) + "...");

    // Get user info from Pinterest API
    const userInfo = await pinterestOAuth.getUserInfo(accessToken);

    // Get boards
    let boards = [];
    try {
      boards = await pinterestOAuth.getBoards(accessToken);
    } catch (boardError) {
      console.warn(
        "⚠️ Could not fetch Pinterest boards during connect:",
        boardError.message,
      );
    }

    // Use provided boardId or first board
    let targetBoardId = boardId;
    let targetBoardName = null;

    if (!targetBoardId && boards && boards.length > 0) {
      targetBoardId = boards[0].id;
      targetBoardName = boards[0].name;
    } else if (targetBoardId && boards && boards.length > 0) {
      const foundBoard = boards.find((b) => b.id === targetBoardId);
      targetBoardName = foundBoard?.name || null;
    }

    // Store tokens
    await pinterestOAuth.storeTokens(userId, {
      accessToken,
      refreshToken: null, // Manual tokens don't have refresh
      boardId: targetBoardId,
      boardName: targetBoardName,
      userInfo: {
        username: userInfo.username || userInfo.account_type || "User",
        profileImage:
          userInfo.profile_image || userInfo.profile_image_url || null,
      },
    });

    res.json({
      success: true,
      message: "Pinterest account connected successfully",
      username: userInfo.username,
      boardId: targetBoardId,
      boardName: targetBoardName,
    });
  } catch (error) {
    console.error("❌ Pinterest connect error:", error);
    console.error("Full error response:", error.response?.data);

    // Provide more detailed error messages
    let errorMessage = error.message || "Failed to connect Pinterest account";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    if (error.response?.data?.code === 1) {
      errorMessage =
        "Consumer app type not supported. Please create a Business or Creator+Advertiser app on Pinterest Developers Console and regenerate your access token.";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data,
    });
  }
});

/* ---------------- ME + ACCOUNTS ---------------- */

router.get("/me", authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

router.get("/accounts", authenticateUser, async (req, res) => {
  try {
    const accounts = await getConnectedAccounts(req.user.userId);
    res.json({ success: true, accounts });
  } catch (error) {
    console.error("Get accounts error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to get connected accounts" });
  }
});

/* ---------------- DISCONNECT (single clean route) ---------------- */
router.delete("/disconnect/:provider", authenticateUser, async (req, res) => {
  try {
    const { provider } = req.params;
    const validProviders = [
      "youtube",
      "instagram",
      "pinterest",
      "facebook",
      "bluesky",
      "linkedin",
      "mastodon",
      "threads",
      "x",
      "reddit",
    ];
    if (!validProviders.includes(provider)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid provider" });
    }

    const { error } = await supabase
      .from("social_tokens")
      .delete()
      .eq("user_id", req.user.userId)
      .eq("provider", provider);

    if (error) throw error;

    res.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (err) {
    console.error("Disconnect error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
