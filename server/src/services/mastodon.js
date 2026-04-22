import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class MastodonService {
  /**
   * Post a status to Mastodon
   */
  async postStatus(accessToken, instanceUrl, content, mediaFiles = []) {
    try {
      const baseUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
      const mediaIds = [];

      // 1. Upload media files if present
      for (const file of mediaFiles) {
        const mediaId = await this.uploadMedia(accessToken, baseUrl, file);
        if (mediaId) mediaIds.push(mediaId);
      }

      // 2. Post the status
      const response = await axios.post(`${baseUrl}/api/v1/statuses`, {
        status: content,
        media_ids: mediaIds
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        id: response.data.id,
        url: response.data.url
      };
    } catch (error) {
      console.error('Mastodon post error:', error.response?.data || error.message);
      throw new Error(`Failed to post to Mastodon: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Upload media to Mastodon
   */
  async uploadMedia(accessToken, baseUrl, file) {
    try {
      const formData = new FormData();
      
      if (typeof file === 'string') {
        // Assume file is a path
        formData.append('file', fs.createReadStream(file));
      } else if (file.path) {
        formData.append('file', fs.createReadStream(file.path));
      } else {
        // Assume it's a buffer or other format handled by axios
        formData.append('file', file);
      }

      const response = await axios.post(`${baseUrl}/api/v1/media`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Mastodon media upload error:', error.response?.data || error.message);
      return null;
    }
  }
}

export default new MastodonService();
