import axios from 'axios';
import fs from 'fs';

class TikTokService {
  /**
   * Publish a video to TikTok using v2 API
   */
  async publishVideo(accessToken, filePath, title) {
    try {
      // 1. Initialize the post
      const stats = fs.statSync(filePath);
      const videoSize = stats.size;

      const initResponse = await axios.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        {
          post_info: {
            title: title || 'New post from QuickPost',
            privacy_level: 'PUBLIC_TO_EVERYONE', // Limited to SELF_ONLY for unaudited apps
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoSize
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
          }
        }
      );

      const { publish_id, upload_url } = initResponse.data.data;

      // 2. Upload the video file
      const videoData = fs.readFileSync(filePath);
      await axios.put(upload_url, videoData, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoSize
        }
      });

      return {
        success: true,
        publishId: publish_id,
        message: 'Video uploaded successfully. TikTok is processing it.'
      };
    } catch (error) {
      console.error('TikTok publish error:', error.response?.data || error.message);
      throw new Error(`Failed to publish to TikTok: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Publish a photo post to TikTok (v2)
   */
  async publishPhoto(accessToken, imageUrl, title) {
    // Note: TikTok v2 photo publishing is limited for certain app types
    // For now, we'll focus on video as it's the primary TikTok use case
    throw new Error('Photo publishing to TikTok is not yet implemented.');
  }
}

export default new TikTokService();
