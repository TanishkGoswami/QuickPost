# Meta Graph API: Critical Gotchas & Constraints

This document contains all the crucial edge cases, strict requirements, rate limits, and "do not forget" points derived from the Meta Graph API documentation for Instagram and Facebook publishing.

**Always double-check these constraints before debugging a failed upload.**

---

## 1. 🚨 Critical Media & Hosting Gotchas

- **Public URLs Only (Instagram):** When creating an Instagram media container using `image_url` or `video_url`, the URL **must be entirely public**. Meta's servers will make an HTTP request to download the file. If the URL requires authentication, has bot-protection (like Cloudflare interstitial), or takes too long to respond, the upload will fail silently or return a generic timeout error.
- **No Local File Bytes for IG:** You cannot send raw video/image bytes in the initial Instagram API request. You must host the file first (e.g., on an AWS S3 bucket, Cloudinary, or a public endpoint on your server).
- **Facebook Upload Sessions:** For Facebook Reels and Video Stories, Meta uses a resumable upload session (`upload_phase=start`, `transfer`, `finish`). For large files, it's highly recommended to use this instead of just passing a URL.

## 2. ⏳ Asynchronous Processing & Polling

- **Video Processing Takes Time:** Creating an Instagram container for a Video or Reel returns a `container_id`. The video is **not** immediately ready to publish.
- **Status Checking:** You must check the container's status via `GET /{ig-container-id}?fields=status_code`. It will start as `IN_PROGRESS`.
- **Never Blindly Publish:** Do not call the `media_publish` endpoint until the `status_code` is explicitly `FINISHED`. If you try to publish while it's `IN_PROGRESS`, the request will fail.
- **Error Handling:** The status might change to `ERROR`. Always handle the `ERROR` state and log the accompanying error message.

## 3. 🛑 Strict Rate Limits

- **Instagram Publishing Limit:** You are limited to **25 API-published posts per 24-hour period** per Instagram Business account. This applies across all API apps (it's an account-level limit, not an app-level limit).
- **Facebook Reels Limit:** You are limited to **30 API-published Reels per 24-hour period** per Facebook Page.
- **Wait Times:** Exceeding these limits will result in a hard block (rate limit error) until the 24-hour rolling window clears.

## 4. 📏 Strict Media Specifications

- **Reels Aspect Ratio:** Reels (both FB and IG) must be exactly **9:16**. Anything else will be rejected.
- **Reels Duration:**
  - Instagram Reels: 5 to 90 seconds. (Exactly 90.1 seconds will fail).
  - Facebook Reels: 3 to 90 seconds.
- **Stories Duration:** Stories are capped at **60 seconds** max. Do not try to post a 90-second video as a story, it will fail.
- **File Formats:** Use **.mp4** for videos (H.264 or HEVC codec). Use .jpg or .png for images. Avoid .mov as it can sometimes cause processing errors on Meta's side depending on the exact encoding.

## 5. 🔐 Account & Permission Restrictions

- **Instagram Account Type:** The target Instagram account **MUST** be an Instagram Business Account. Creator accounts and Personal accounts will throw an authorization error if you try to publish via the API.
- **Linked Facebook Page:** The Instagram account must be properly linked to a published Facebook Page.
- **App Review Required:** To use the app in production for other users, your Meta App must pass App Review for `instagram_business_content_publish` and `pages_manage_posts`. Without this, the API will only work for developers/testers added in the Meta App dashboard.
- **Page Publishing Authorization (PPA):** If the Facebook Page requires Two-Factor Authentication or country-specific authorization for its admins, the API token might fail if the user generating the token hasn't completed those steps in their personal Facebook account.

## Summary Checklist for Debugging Upload Failures

1. [ ] Is the media URL 100% public?
2. [ ] Is the Instagram account a Business account (not Creator)?
3. [ ] Has the 25/day (IG) or 30/day (FB) limit been reached?
4. [ ] Is the video strictly 9:16 and under 90 seconds?
5. [ ] Did the container status explicitly reach `FINISHED` before publishing?
