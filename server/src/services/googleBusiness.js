import axios from 'axios';
import fs from 'fs';

/**
 * Post to Google Business Profile
 * @param {string} caption - The text content of the post
 * @param {Array<string>} mediaUrls - Array of media URLs to attach
 * @param {Object} tokens - User's Google Business Profile tokens
 * @param {Object} postData - Additional post data (e.g., link, actionType)
 * @returns {Promise<Object>} Success result with mediaId
 */
export async function postToGoogleBusiness(caption, mediaUrls, tokens, postData = {}) {
  try {
    const { accessToken, profile_data } = tokens;
    
    if (!profile_data?.locationId) {
      throw new Error("No Google Business Profile location ID found. Please reconnect your account.");
    }

    const locationId = profile_data.locationId; // e.g., "accounts/123/locations/456"
    
    // Construct the LocalPost body
    const requestBody = {
      languageCode: "en-US",
      summary: caption,
    };

    // Add media if available
    if (mediaUrls && mediaUrls.length > 0) {
      // Google Business Profile only supports 1 media item for local posts currently, but we'll try to add up to what they allow
      requestBody.media = mediaUrls.map(url => ({
        mediaFormat: "PHOTO", // Or "VIDEO" if supported later
        sourceUrl: url
      }));
    }

    // Add Call To Action if provided in platData
    if (postData?.actionType && postData?.actionUrl) {
      requestBody.callToAction = {
        actionType: postData.actionType, // e.g., "LEARN_MORE", "BOOK", "ORDER"
        url: postData.actionUrl
      };
    }

    console.log(`📡 [GBP] Posting to ${locationId}...`);
    
    const response = await axios.post(
      `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ [GBP] Post successful:", response.data.name);

    return {
      success: true,
      mediaId: response.data.name,
      url: response.data.searchUrl || null,
    };
  } catch (error) {
    console.error("❌ Google Business Profile posting error:", error.response?.data || error.message);
    throw new Error(`Google Business Profile error: ${error.response?.data?.error?.message || error.message}`);
  }
}
