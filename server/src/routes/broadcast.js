import express from "express";
import { upload, handleUploadError } from "../middleware/upload.js";
import { saveBroadcast } from "../services/broadcasts.js";
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from "../services/cloudinary.js";
import { executeBroadcast } from "../services/postingService.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import fs from "fs";

const router = express.Router();

/**
 * POST /api/broadcast
 * Universal endpoint for broadcasting images or videos to appropriate platforms
 * @protected Requires authentication
 */
router.post(
  "/broadcast",
  authenticateUser,
  upload.array("media", 10),
  handleUploadError,
  async (req, res) => {
    let uploadedFiles = [];

    try {
      // Validate request
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No media files uploaded",
        });
      }

      const {
        caption,
        selectedChannels,
        platformData,
        scheduledAt,
        isScheduled: isScheduledField,
      } = req.body;
      const userId = req.user.userId;

      const channels =
        typeof selectedChannels === "string"
          ? JSON.parse(selectedChannels)
          : selectedChannels;
      const platData =
        typeof platformData === "string"
          ? JSON.parse(platformData)
          : platformData;
      const isScheduled = isScheduledField === "true" || !!scheduledAt;

      uploadedFiles = req.files;
      const filenames = uploadedFiles.map((f) => f.filename);
      const filePaths = uploadedFiles.map((f) => f.path);

      // Improved media detection for mixed sets
      const videos = uploadedFiles.filter((f) =>
        f.mimetype.startsWith("video/"),
      );
      const isVideo = videos.length > 0;
      const mediaType = isVideo ? "video" : "image";

      console.log(
        `\n🚀 Broadcast request received. Type: ${mediaType}, User: ${userId}, Scheduled: ${isScheduled ? scheduledAt : "Immediate"}`,
      );

      // Upload all to Cloudinary
      let mediaUrls = [];
      if (isCloudinaryConfigured()) {
        console.log(
          `\n☁️  Uploading ${uploadedFiles.length} files to Cloudinary...`,
        );
        const uploadPromises = filePaths.map((path) =>
          uploadToCloudinary(path, isVideo ? "video" : "image"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.map((r) => r.url);
        console.log(`✓ All files uploaded. URLs:`, mediaUrls);
      } else {
        const serverPublicUrl =
          process.env.SERVER_PUBLIC_URL || "http://localhost:5000";
        mediaUrls = filenames.map(
          (name) => `${serverPublicUrl}/uploads/${name}`,
        );
      }

      if (isScheduled) {
        // Save to DB as scheduled
        const broadcast = await saveBroadcast(
          userId,
          caption,
          filenames,
          { mediaUrls },
          mediaType,
          { ...platData, selectedChannels: channels, filePaths }, // Store filePaths for scheduler
          "scheduled",
          scheduledAt,
        );

        return res.status(200).json({
          success: true,
          message: "Post scheduled successfully",
          broadcastId: broadcast?.id,
        });
      } else {
        // Create record in DB first
        const broadcast = await saveBroadcast(
          userId,
          caption,
          filenames,
          { mediaUrls },
          mediaType,
          { ...platData, selectedChannels: channels },
          "sending",
        );

        // Post immediately
        const results = await executeBroadcast(
          broadcast.id,
          userId,
          caption,
          mediaUrls,
          filePaths,
          channels,
          platData,
          mediaType,
        );

        // Cleanup files after immediate broadcast
        setTimeout(() => {
          filePaths.forEach((p) => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
          });
        }, 5000);

        return res.status(200).json({ success: true, results });
      }
    } catch (error) {
      console.error("❌ Broadcast error:", error);
      return res
        .status(500)
        .json({
          success: false,
          error: "Broadcasting failed",
          message: error.message,
        });
    }
  },
);

export default router;
