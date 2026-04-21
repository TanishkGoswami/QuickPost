import cron from "node-cron";
import { getDueScheduledBroadcasts } from "./broadcasts.js";
import { executeBroadcast } from "./postingService.js";
import fs from "fs";

/**
 * Initialize the scheduler
 */
export function initScheduler() {
  console.log("⏰ Initializing Post Scheduler...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const duePosts = await getDueScheduledBroadcasts();

      if (duePosts.length > 0) {
        console.log(
          `⏰ Found ${duePosts.length} due scheduled posts. Processing...`,
        );

        for (const post of duePosts) {
          try {
            console.log(`🚀 Processing scheduled post: ${post.id}`);

            // Extract necessary data from the post record
            const {
              id,
              user_id,
              caption,
              media_urls,
              platform_data,
              media_type,
            } = post;

            const channels = platform_data?.selectedChannels || [];
            const filePaths = platform_data?.filePaths || [];

            await executeBroadcast(
              id,
              user_id,
              caption,
              media_urls,
              filePaths,
              channels,
              platform_data,
              media_type,
            );

            console.log(`✅ Successfully processed scheduled post: ${id}`);

            // Cleanup files after successful broadcast
            setTimeout(() => {
              filePaths.forEach((p) => {
                if (fs.existsSync(p)) fs.unlinkSync(p);
              });
            }, 5000);
          } catch (postError) {
            console.error(
              `❌ Error processing scheduled post ${post.id}:`,
              postError,
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Scheduler Error:", error);
    }
  });
}
