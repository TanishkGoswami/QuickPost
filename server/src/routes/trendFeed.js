import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { getTrendFeedPage } from "../services/trendFeed.js";

const router = express.Router();

router.get("/trends/feed", authenticateUser, async (req, res) => {
  try {
    const page = await getTrendFeedPage(req.query);
    res.json(page);
  } catch (error) {
    console.error("[TREND-FEED] Feed error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load trend feed",
    });
  }
});

export default router;
