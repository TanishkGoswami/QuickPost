import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { getConnectedAccounts } from "../services/supabase.js";
import googleOAuth from "../services/googleOAuth.js";

const router = express.Router();

router.get("/accounts", authenticateUser, async (req, res) => {
  try {
    const connected = await getConnectedAccounts(req.user);
    const accounts = connected.youtubeAccounts || [];
    const enriched = await Promise.all(accounts.map(async (account) => {
      try {
        const accessToken = await googleOAuth.getValidAccessToken(req.user.userId, account.id);
        const health = await googleOAuth.getChannelHealth(accessToken);
        const videos = await googleOAuth.listChannelUploads(accessToken, health.uploadsPlaylistId);
        return {
          ...account,
          username: health.title || account.username,
          profilePicture: health.thumbnail || account.profilePicture,
          youtube: health,
          videos,
        };
      } catch (error) {
        return {
          ...account,
          youtube: null,
          requiredActions: [{
            id: "youtube-reconnect",
            label: "Reconnect YouTube",
            description: error.message || "We could not refresh this YouTube account.",
            url: null,
          }],
        };
      }
    }));

    res.json({ success: true, accounts: enriched });
  } catch (error) {
    console.error("YouTube accounts error:", error);
    res.status(500).json({ success: false, error: "Failed to load YouTube accounts" });
  }
});

router.patch("/videos/:videoId/visibility", authenticateUser, async (req, res) => {
  const { accountId, privacyStatus } = req.body || {};
  if (!accountId) return res.status(400).json({ success: false, error: "YouTube account is required" });
  if (!["public", "private", "unlisted"].includes(privacyStatus)) {
    return res.status(400).json({ success: false, error: "Invalid visibility" });
  }

  try {
    const accessToken = await googleOAuth.getValidAccessToken(req.user.userId, accountId);
    const nextStatus = await googleOAuth.updateVideoVisibility(accessToken, req.params.videoId, privacyStatus);
    res.json({ success: true, privacyStatus: nextStatus });
  } catch (error) {
    console.error("YouTube visibility update error:", error);
    const message = error.response?.data?.error?.message || error.message || "Failed to update visibility";
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
