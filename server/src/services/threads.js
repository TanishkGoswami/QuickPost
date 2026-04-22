import axios from 'axios';

const THREADS_API_URL = 'https://graph.threads.net/v1.0';

/**
 * Poll a Threads media container until it reaches FINISHED status.
 * Threads needs time to download & transcode media from the provided URL.
 *
 * @param {string} accessToken
 * @param {string} containerId
 * @param {number} maxWaitMs   - total ms to wait (default 3 min)
 * @param {number} intervalMs  - polling interval (default 5 s)
 */
async function waitForContainerReady(accessToken, containerId, maxWaitMs = 180_000, intervalMs = 5_000) {
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    await new Promise(r => setTimeout(r, intervalMs));

    const { data } = await axios.get(`${THREADS_API_URL}/${containerId}`, {
      params: {
        fields: 'status,error_message',
        access_token: accessToken,
      },
    });

    const status = (data.status || '').toUpperCase();
    console.log(`   ↳ [attempt ${attempt}] Container ${containerId} status: ${status}`);

    if (status === 'FINISHED') return true;

    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(
        `Threads container ${containerId} reached terminal status: ${status}` +
        (data.error_message ? ` — ${data.error_message}` : '')
      );
    }
    // IN_PROGRESS or empty → keep polling
  }

  throw new Error(
    `Threads container ${containerId} did not finish processing within ${maxWaitMs / 1000}s`
  );
}

/**
 * Create a single child container for a carousel item.
 * Must pass is_carousel_item=true — Threads requires this flag.
 */
async function createCarouselChild(accessToken, threadsUserId, mediaUrl, itemMediaType) {
  const isVideo = itemMediaType === 'video';
  const params = {
    media_type: isVideo ? 'VIDEO' : 'IMAGE',
    is_carousel_item: true,
    access_token: accessToken,
    ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl }),
  };

  const res = await axios.post(
    `${THREADS_API_URL}/${threadsUserId}/threads`,
    null,
    { params }
  );
  return res.data.id;
}

/**
 * Post a CAROUSEL (multiple images/videos) to Threads.
 * Threads carousel supports up to 20 items, mixed images and videos.
 *
 * Flow:
 *  1. Create child containers (one per media item) with is_carousel_item=true
 *  2. Poll each child until FINISHED
 *  3. Create carousel container referencing all child IDs
 *  4. Poll carousel container until FINISHED
 *  5. Publish the carousel
 */
async function postCarouselToThreads(accessToken, threadsUserId, caption, mediaItems) {
  console.log(`\n🎠 Posting Threads carousel (${mediaItems.length} items)...`);

  // ── Step 1 & 2: Create + await each child container ──
  const childIds = [];
  for (let i = 0; i < mediaItems.length; i++) {
    const { url, type } = mediaItems[i];
    console.log(`  📎 Creating child container ${i + 1}/${mediaItems.length}: ${type}`);
    const childId = await createCarouselChild(accessToken, threadsUserId, url, type);
    console.log(`  ✅ Child created: ${childId}`);

    if (type === 'video') {
      console.log(`  ⏳ Polling child ${childId} (video needs processing)...`);
      await waitForContainerReady(accessToken, childId);
      console.log(`  ✅ Child ${childId} is FINISHED`);
    } else {
      // Images process quickly — short wait
      await new Promise(r => setTimeout(r, 2_000));
    }

    childIds.push(childId);
  }

  // ── Step 3: Create the carousel container ──
  console.log(`\n  📦 Creating carousel container with ${childIds.length} children...`);
  const carouselRes = await axios.post(
    `${THREADS_API_URL}/${threadsUserId}/threads`,
    null,
    {
      params: {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        text: caption,
        access_token: accessToken,
      },
    }
  );
  const carouselId = carouselRes.data.id;
  console.log(`  ✅ Carousel container created: ${carouselId}`);

  // ── Step 4: Poll carousel container ──
  console.log(`  ⏳ Polling carousel container status...`);
  await waitForContainerReady(accessToken, carouselId);
  console.log(`  ✅ Carousel container is FINISHED — publishing...`);

  // ── Step 5: Publish ──
  const publishRes = await axios.post(
    `${THREADS_API_URL}/${threadsUserId}/threads_publish`,
    null,
    {
      params: {
        creation_id: carouselId,
        access_token: accessToken,
      },
    }
  );

  console.log('✅ Threads carousel post successful! Post ID:', publishRes.data.id);
  return {
    success: true,
    postId: publishRes.data.id,
    platform: 'Threads',
    type: 'carousel',
    itemCount: mediaItems.length,
  };
}

/**
 * Post to Threads — auto-selects single or carousel mode.
 *
 * @param {string} accessToken
 * @param {string} threadsUserId
 * @param {string} caption
 * @param {string|string[]} mediaUrl  - Single URL or array of URLs
 * @param {string} mediaType          - 'image' | 'video' (primary type)
 * @param {Array}  mediaItems         - Optional: [{url, type}] for explicit carousel
 */
async function postToThreads(accessToken, threadsUserId, caption, mediaUrl, mediaType = 'image', mediaItems = []) {
  // ─── Carousel: 2+ items ────────────────────────────────────────────────────
  const carouselItems = mediaItems.length >= 2
    ? mediaItems
    : Array.isArray(mediaUrl) && mediaUrl.length >= 2
      ? mediaUrl.map(u => ({ url: u, type: mediaType }))
      : [];

  if (carouselItems.length >= 2) {
    return postCarouselToThreads(accessToken, threadsUserId, caption, carouselItems);
  }

  // ─── Single item ───────────────────────────────────────────────────────────
  console.log(`\n🧵 Posting ${mediaType} to Threads...`);
  console.log('User ID:', threadsUserId);

  const singleUrl = Array.isArray(mediaUrl) ? mediaUrl[0] : mediaUrl;

  // Step 1: Create container
  const containerParams = {
    media_type: mediaType === 'video' ? 'VIDEO' : 'IMAGE',
    text: caption,
    access_token: accessToken,
    ...(mediaType === 'video' ? { video_url: singleUrl } : { image_url: singleUrl }),
  };

  const containerRes = await axios.post(
    `${THREADS_API_URL}/${threadsUserId}/threads`,
    null,
    { params: containerParams }
  );

  const creationId = containerRes.data.id;
  console.log('✅ Threads: Container created, ID:', creationId);

  // Step 2: Wait for processing
  if (mediaType === 'video') {
    console.log('⏳ Polling Threads container status (videos can take 30–90 s)...');
    await waitForContainerReady(accessToken, creationId);
    console.log('✅ Container FINISHED — publishing...');
  } else {
    console.log('⏳ Waiting for Threads to process media...');
    await new Promise(r => setTimeout(r, 3_000));
  }

  // Step 3: Publish
  const publishRes = await axios.post(
    `${THREADS_API_URL}/${threadsUserId}/threads_publish`,
    null,
    {
      params: {
        creation_id: creationId,
        access_token: accessToken,
      },
    }
  );

  console.log('✅ Threads post successful!');
  console.log('Post ID:', publishRes.data.id);

  return {
    success: true,
    postId: publishRes.data.id,
    platform: 'Threads',
  };
}

export { postToThreads };
