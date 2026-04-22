import axios from 'axios';

const THREADS_API_URL = 'https://graph.threads.net/v1.0';

/**
 * Post to Threads (2-step process)
 */
async function postToThreads(accessToken, threadsUserId, caption, mediaUrl, mediaType = 'image') {
  try {
    console.log(`\n🧵 Posting ${mediaType} to Threads...`);
    console.log('User ID:', threadsUserId);

    // 1. Create a media container
    const containerParams = {
      media_type: mediaType.toUpperCase(),
      text: caption,
      access_token: accessToken,
    };

    if (mediaType === 'video') {
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }

    const containerRes = await axios.post(
      `${THREADS_API_URL}/${threadsUserId}/threads`,
      null,
      { params: containerParams }
    );

    const creationId = containerRes.data.id;
    console.log('✅ Threads: Container created, ID:', creationId);

    // 2. Wait for processing (especially for videos)
    // For small images/videos, a few seconds or a simple retry loop is often needed
    // In a real production app, we would poll the container status
    console.log('⏳ Waiting for Threads to process media...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Publish the container
    const publishRes = await axios.post(
      `${THREADS_API_URL}/${threadsUserId}/threads_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        }
      }
    );

    console.log('✅ Threads post successful!');
    console.log('Post ID:', publishRes.data.id);

    return {
      success: true,
      postId: publishRes.data.id,
      platform: 'Threads',
    };
  } catch (error) {
    console.error('❌ Threads posting error:', error.response?.data || error.message);
    
    // If it failed because processing isn't finished, we could retry once
    if (error.response?.data?.error?.error_user_msg?.includes('processing')) {
       console.log('🔄 Threads still processing, retrying in 10 seconds...');
       await new Promise(resolve => setTimeout(resolve, 10000));
       try {
         const retryRes = await axios.post(
           `${THREADS_API_URL}/${threadsUserId}/threads_publish`,
           null,
           { params: { creation_id: creationId, access_token: accessToken } }
         );
         return { success: true, postId: retryRes.data.id, platform: 'Threads' };
       } catch (retryError) {
         console.error('❌ Threads retry failed:', retryError.response?.data || retryError.message);
       }
    }

    throw new Error(
      error.response?.data?.error?.message || 'Failed to post to Threads'
    );
  }
}

export { postToThreads };
