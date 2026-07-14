# Meta Graph API Publishing Documentation

This document serves as the central reference for implementing content publishing (Posts, Reels, and Stories) to Facebook and Instagram via the Meta Graph API. **Always refer to this document when working on or modifying the publishing workflows.**

## 1. Instagram Publishing API

Publishing to Instagram requires an **Instagram Business account** linked to a Facebook Page. You cannot use the API to publish to Creator or Personal accounts.

The core flow for Instagram is a two-step process:

1. **Create a Media Container:** Upload the media and define what type it is.
2. **Publish the Media:** Publish the container once Meta has finished processing the upload.

### Instagram Feed Posts (Images/Videos)

- **Endpoint:** `POST /{ig-user-id}/media` (to create container), then `POST /{ig-user-id}/media_publish`
- **Parameters:** `image_url` or `video_url`, and optional `caption`.
- **Docs:** [Content Publishing Guide](https://developers.facebook.com/docs/instagram/content-publishing)

### Instagram Reels

- **Endpoint:** `POST /{ig-user-id}/media`
- **Parameters:** `media_type=REELS` and `video_url` (must be public).
- **Details:** Must be 9:16 aspect ratio, 5–90 seconds long. After creating the container, you must poll the `status_code` of the container until it is `FINISHED` before you can call `media_publish`.
- **Docs:** [Instagram Reels API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/#reels-posts)

### Instagram Stories

- **Endpoint:** `POST /{ig-user-id}/media`
- **Parameters:** `media_type=STORIES` along with `image_url` or `video_url`.
- **Docs:** [Instagram Stories API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing/#stories-posts)

**Required Permissions for Instagram:**

- `instagram_business_basic`
- `instagram_business_content_publish`

---

## 2. Facebook Page Publishing API

Publishing to Facebook Pages uses different endpoints directly on the Facebook Page node. It requires a Page Access Token.

### Facebook Feed Posts (Photos/Videos/Text)

- **Endpoint:** `POST /{page-id}/feed` (Text/Links), `POST /{page-id}/photos` (Images), `POST /{page-id}/videos` (Videos)
- **Docs:** [Facebook Page Post API](https://developers.facebook.com/docs/pages/publishing/)

### Facebook Reels

- **Endpoint:** `POST /{page_id}/video_reels`
- **Workflow:** This uses an upload session.
  1. Initialize the upload session.
  2. Upload the MP4 video file.
  3. Publish the reel to the Page.
- **Details:** Limited to 30 API-published reels per 24-hour period.
- **Docs:** [Facebook Reels API](https://developers.facebook.com/docs/video-api/guides/reels-publishing)

### Facebook Stories

- **Endpoint:** `POST /{page_id}/video_stories` (for video) or `POST /{page_id}/photo_stories` (for images).
- **Workflow:** Similar to Reels, it uses an upload phase (`upload_phase=start`, `transfer`, `finish`).
- **Details:** Video Stories can be 3–90 seconds long (but Reels-as-Stories cannot exceed 60 seconds). Recommended 1080x1920 resolution.
- **Docs:** [Facebook Stories API](https://developers.facebook.com/docs/pages/publishing/stories)

**Required Permissions for Facebook:**

- `pages_manage_posts`
- `pages_read_engagement`
- `pages_show_list`

---

## Important Implementation Notes

1. **Public Media URLs:** For Instagram, the media files (`video_url`, `image_url`) MUST be hosted on a publicly accessible server so Meta's servers can download them. You cannot send the raw file bytes in the initial request for Instagram.
2. **App Review:** To use these APIs in production, your Meta App will need to go through the App Review process to get the required permissions approved.
3. **Webhooks vs Polling:** While you can poll the `status_code` for container processing, setting up Meta Webhooks is the recommended and more robust approach to handle asynchronous processing of media uploads.
