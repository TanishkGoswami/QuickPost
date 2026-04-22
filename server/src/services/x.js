import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import xOAuth from './xOAuth.js';

const X_API_V2_URL = 'https://api.twitter.com/2';
const X_UPLOAD_URL = 'https://upload.twitter.com/1.1';

/**
 * Helper: RFC 3986 Percent Encoding
 */
function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Helper: Generate OAuth 1.0a Authorization Header
 */
function getOAuth1Header(method, url, params = {}) {
  const consumerKey = (process.env.X_API_KEY || '').trim();
  const consumerSecret = (process.env.X_API_SECRET_KEY || '').trim();
  const accessToken = (process.env.X_ACCESS_TOKEN || '').trim();
  const tokenSecret = (process.env.X_ACCESS_TOKEN_SECRET || '').trim();

  if (!consumerKey || !consumerSecret || !accessToken || !tokenSecret) {
    return null;
  }

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0'
  };

  // Sign EVERYTHING (oauth params + request params)
  const sigParams = { ...oauthParams, ...params };
  const parameterString = Object.keys(sigParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(sigParams[key])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url.split('?')[0]),
    percentEncode(parameterString)
  ].join('&');

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  // The final header should ONLY contain oauth_ prefixed parameters
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(', ');

  return authHeader;
}

/**
 * Robust Media Upload for X (supports images & large videos)
 */
async function uploadMediaChunked(mediaUrl, bearerToken) {
  try {
    console.log(`𝕏 Starting media upload for: ${mediaUrl}`);

    const usePowerMode = !!(process.env.X_API_KEY && process.env.X_API_SECRET_KEY);
    
    // 1. Get the media buffer
    const response = await axios.get(mediaUrl, { 
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'QuickPost/1.0.0' }
    });
    const buffer = Buffer.from(response.data);
    const totalBytes = buffer.length;
    const mediaType = response.headers['content-type'] || 'image/jpeg';
    const isVideo = mediaType.startsWith('video/');
    const mediaCategory = isVideo ? 'tweet_video' : 'tweet_image';

    const baseUrl = `${X_UPLOAD_URL}/media/upload.json`;
    const commonHeaders = { 'User-Agent': 'QuickPost/1.0.0', 'Accept': '*/*' };

    // STEP 1: INIT
    const initParams = {
      command: 'INIT',
      total_bytes: totalBytes.toString(),
      media_type: mediaType,
      media_category: mediaCategory
    };

    const initHeaders = usePowerMode 
      ? { ...commonHeaders, 'Authorization': getOAuth1Header('POST', baseUrl, initParams) }
      : { ...commonHeaders, 'Authorization': `Bearer ${bearerToken}` };

    // When params are in the Header, we send an empty POST body
    const initRes = await axios.post(baseUrl, null, { headers: initHeaders });
    const mediaId = initRes.data.media_id_string;
    console.log(`✓ INIT [POWER] Complete: ${mediaId}`);

    // STEP 2: APPEND
    const CHUNK_SIZE = 5 * 1024 * 1024;
    let segmentIndex = 0;
    
    for (let offset = 0; offset < totalBytes; offset += CHUNK_SIZE) {
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      const formData = new FormData();
      formData.append('command', 'APPEND');
      formData.append('media_id', mediaId);
      formData.append('segment_index', segmentIndex.toString());
      formData.append('media', chunk);

      const appendHeaders = usePowerMode
        ? { ...commonHeaders, 'Authorization': getOAuth1Header('POST', baseUrl, {}, false) }
        : { ...commonHeaders, 'Authorization': `Bearer ${bearerToken}` };

      await axios.post(baseUrl, formData, {
        headers: { ...formData.getHeaders(), ...appendHeaders }
      });
      
      console.log(`✓ APPEND Segment ${segmentIndex} success`);
      segmentIndex++;
    }

    // STEP 3: FINALIZE
    const finalizeParams = { command: 'FINALIZE', media_id: mediaId };
    const finalizeHeaders = usePowerMode
      ? { ...commonHeaders, 'Authorization': getOAuth1Header('POST', baseUrl, finalizeParams) }
      : { ...commonHeaders, 'Authorization': `Bearer ${bearerToken}` };

    const finalizeRes = await axios.post(baseUrl, null, { headers: finalizeHeaders });
    console.log(`✓ FINALIZE Complete`);

    if (isVideo || finalizeRes.data.processing_info) {
      await checkProcessingStatus(mediaId, bearerToken, usePowerMode, commonHeaders);
    }

    return mediaId;
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('❌ X Upload Error:', errorData);
    throw new Error(`X Media Upload Failed: ${JSON.stringify(errorData)}`);
  }
}

async function checkProcessingStatus(mediaId, bearerToken, usePowerMode, commonHeaders) {
  let attempts = 0;
  const maxAttempts = 30;
  const baseUrl = `${X_UPLOAD_URL}/media/upload.json`;

  while (attempts < maxAttempts) {
    const statusParams = { command: 'STATUS', media_id: mediaId };
    const statusHeaders = usePowerMode
      ? { ...commonHeaders, 'Authorization': getOAuth1Header('GET', baseUrl, statusParams) }
      : { ...commonHeaders, 'Authorization': `Bearer ${bearerToken}` };

    const statusRes = await axios.get(baseUrl, { params: statusParams, headers: statusHeaders });
    const info = statusRes.data.processing_info;
    console.log(`⏳ Processing Status: ${info.state}`);

    if (info.state === 'succeeded') return true;
    if (info.state === 'failed') throw new Error(`X Media Processing Failed`);

    await new Promise(resolve => setTimeout(resolve, (info.check_after_secs || 5) * 1000));
    attempts++;
  }
  throw new Error('X Media Processing Timed Out');
}

export async function broadcastToX(text, mediaUrls, tokens, userId = null) {
  try {
    let activeAccessToken = tokens.accessToken;
    const { refreshToken, tokenExpiry, accountId } = tokens;

    // TOKEN REFRESH LOGIC
    if (userId && refreshToken && tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      if (expiryDate < fiveMinutesFromNow) {
        console.log('🔄 X Token expired or near expiry, refreshing...');
        try {
          const newAccessToken = await xOAuth.refreshAccessToken(userId, refreshToken, accountId);
          activeAccessToken = newAccessToken;
          console.log('✅ X Token refreshed successfully for broadcast');
        } catch (refreshError) {
          console.error('❌ X Token refresh failed during broadcast:', refreshError.message);
        }
      }
    }

    const mediaIds = [];
    const failedUrls = [];
    let finalText = text || '';

    if (mediaUrls && mediaUrls.length > 0) {
      console.log(`🎯 Processing ${mediaUrls.length} image(s) for X...`);
      for (const url of mediaUrls.slice(0, 4)) {
        try {
          const mediaId = await uploadMediaChunked(url, activeAccessToken);
          mediaIds.push(mediaId);
        } catch (uploadError) {
          console.warn(`⚠️ X Media Upload Failed: ${uploadError.message}`);
          console.log('💡 Falling back to Link-post mode for this image.');
          failedUrls.push(url);
        }
      }
    }

    // FALLBACK LOGIC: If any uploads failed, append the links to the text
    if (failedUrls.length > 0) {
      if (finalText) finalText += '\n\n';
      failedUrls.forEach((url, index) => {
        finalText += `🔗 Photo ${failedUrls.length > 1 ? index + 1 : ''}: ${url}\n`;
      });
      finalText = finalText.trim();
    }

    const tweetData = { text: finalText };
    if (mediaIds.length > 0) tweetData.media = { media_ids: mediaIds };

    // FINAL TWEET POST: Always use the OAuth 2.0 Bearer token for V2 endpoints (native & reliable)
    const tweetUrl = `${X_API_V2_URL}/tweets`;
    
    const publishTweet = async (token) => {
      const headers = { 
        'User-Agent': 'QuickPost/1.0.0 (Agentic AI Scheduler)',
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      };
      return axios.post(tweetUrl, tweetData, { headers });
    };

    console.log(`𝕏 Publishing to X [${mediaIds.length > 0 ? 'Embedded' : 'Link-post'}]...`);
    
    let response;
    try {
      response = await publishTweet(activeAccessToken);
    } catch (publishError) {
      if (publishError.response?.status === 401 && userId && refreshToken) {
        console.warn('⚠️ X Token rejected (401). Attempting emergency refresh...');
        try {
          const freshToken = await xOAuth.refreshAccessToken(userId, refreshToken, accountId);
          console.log('✅ Emergency refresh successful. Retrying post...');
          response = await publishTweet(freshToken);
        } catch (refreshError) {
          console.error('❌ Emergency refresh failed:', refreshError.message);
          throw publishError; // Throw the original 401 if refresh fails
        }
      } else {
        throw publishError;
      }
    }

    return {
      success: true,
      platform: 'X',
      postId: response.data.data.id,
      url: `https://x.com/i/status/${response.data.data.id}`
    };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('❌ X Broadcasting Error:', errorData);
    return { success: false, platform: 'X', error: typeof errorData === 'object' ? JSON.stringify(errorData) : errorData };
  }
}
