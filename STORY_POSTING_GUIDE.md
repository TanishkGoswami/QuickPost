# The Ultimate Guide to Story Posting via Meta Graph API

This guide provides the exact implementation details for building a Story posting feature for both Instagram and Facebook. 

A common pitfall is accidentally posting a Story as a regular Feed Post or Reel. This document emphasizes exactly how to ensure your media goes to the **Stories** tray.

---

## 1. Instagram Stories

To post an Instagram Story, you use the standard Instagram Content Publishing API, but you **must explicitly declare the media type**.

### The Flow
1. **Create the Media Container** (Upload)
2. **Wait for Processing** (Poll status)
3. **Publish the Container**

### How to ensure it posts as a Story (Not a Post)
When you make the initial `POST` request to create the container, you **MUST** include the `media_type=STORIES` parameter. If you omit this, Instagram defaults to a regular Feed post.

**Step 1: Container Creation Request**
```http
POST https://graph.facebook.com/v19.0/{ig-user-id}/media
```
**Required Payload for an Image Story:**
```json
{
  "image_url": "https://your-server.com/public-image.jpg",
  "media_type": "STORIES",
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```

**Required Payload for a Video Story:**
```json
{
  "video_url": "https://your-server.com/public-video.mp4",
  "media_type": "STORIES",
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```

*Note: The `caption` parameter is ignored for Stories because Instagram Stories do not support captions via the API.*

**Step 2: Check Status**
```http
GET https://graph.facebook.com/v19.0/{ig-container-id}?fields=status_code
```
*Wait until `status_code` equals `FINISHED`.*

**Step 3: Publish**
```http
POST https://graph.facebook.com/v19.0/{ig-user-id}/media_publish
```
```json
{
  "creation_id": "{ig-container-id}",
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```

---

## 2. Facebook Page Stories

Facebook uses entirely different endpoints for Stories than it does for Feed posts. To ensure your media does not end up on the Page's timeline as a regular post, **do not use** `/{page-id}/feed`, `/{page-id}/photos`, or `/{page-id}/videos`.

Instead, use the dedicated **Stories edges**.

### Facebook Photo Stories
**Endpoint:** `POST /{page-id}/photo_stories`

**Payload:**
```json
{
  "url": "https://your-server.com/public-image.jpg",
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```
*Unlike Facebook Feed photos, using the `photo_stories` edge guarantees it goes to the Story tray.*

### Facebook Video Stories
**Endpoint:** `POST /{page-id}/video_stories`

Facebook Video Stories require a resumable upload session (Start -> Transfer -> Finish). 

**Step 1: Start the Session**
```http
POST https://graph.facebook.com/v19.0/{page-id}/video_stories
```
```json
{
  "upload_phase": "start",
  "file_size": 10485760, 
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```
*This returns an `upload_session_id` and a `video_id`.*

**Step 2: Transfer the File**
You send the actual file chunks as `multipart/form-data` to the `/{page-id}/video_stories` endpoint using the `upload_session_id`.

**Step 3: Finish the Upload**
```http
POST https://graph.facebook.com/v19.0/{page-id}/video_stories
```
```json
{
  "upload_phase": "finish",
  "upload_session_id": "{upload_session_id}",
  "access_token": "YOUR_PAGE_ACCESS_TOKEN"
}
```
*Once finished, Facebook processes the video and adds it to the Page's Story.*

---

## 3. Important Rules for Building Story Functionality

### 📏 Specifications
*   **Aspect Ratio:** You should strongly enforce a **9:16 aspect ratio** in your UI before letting users upload. While other ratios might technically upload, they look terrible in Stories and are often letterboxed or cropped unpredictably.
*   **Video Length:** 
    *   Instagram Stories: Maximum **60 seconds**.
    *   Facebook Stories: Maximum **60 seconds** (can sometimes accept up to 90s but docs say 1-60s for guaranteed story placement).
    *   *If you upload a 90-second video as a story, it will likely throw an API error.*
*   **No Links/Stickers:** The current API does NOT allow you to add "Swipe Up" links, Link Stickers, Polls, or Q&A boxes. You can only upload the raw video/image.

### 🐛 Common Pitfall Checklist (How to avoid "Story posted as a Feed Post")
1. [ ] **Instagram:** Did I include `"media_type": "STORIES"` in the payload? If missing, it goes to the Feed.
2. [ ] **Facebook Image:** Did I use the `/{page-id}/photo_stories` endpoint? If you used `/{page-id}/photos`, it goes to the Feed.
3. [ ] **Facebook Video:** Did I use the `/{page-id}/video_stories` endpoint? If you used `/{page-id}/videos`, it goes to the Feed.
