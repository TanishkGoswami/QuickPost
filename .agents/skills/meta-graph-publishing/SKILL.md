---
name: meta-graph-publishing
description: Use this skill when implementing, modifying, or debugging Meta Graph API publishing features, including Facebook and Instagram Posts, Reels, and Stories.
---
# Meta Graph API Publishing Rules and Guidelines

When working on Meta Graph API integrations in this project, YOU MUST adhere to these strict constraints, endpoints, and workflows.

## 1. General Constraints & Gotchas
- **Instagram Publishing Limit:** 25 posts per 24 hours per IG Business Account.
- **Facebook Reels Limit:** 30 reels per 24 hours per FB Page.
- **Instagram Account Type:** MUST be an Instagram Business account. Creator accounts will fail.
- **Media Hosting:** For Instagram, `video_url` and `image_url` must be completely public with no authentication or bot-protection required.

## 2. Instagram Publishing Flow
Instagram uses a two-step process: Create Container -> Publish Container.
**DO NOT blindly publish.** You must check `GET /{ig-container-id}?fields=status_code` and wait until the status is `FINISHED` before calling `/{ig-user-id}/media_publish`.

### IG Posts (Feed)
- **Container Endpoint:** `POST /{ig-user-id}/media`
- **Params:** `image_url` or `video_url`, optional `caption`.

### IG Reels
- **Container Endpoint:** `POST /{ig-user-id}/media`
- **Params:** `media_type=REELS`, `video_url`.
- **Specs:** Must be 9:16 aspect ratio, 5-90 seconds long.

### IG Stories 🚨
- **Container Endpoint:** `POST /{ig-user-id}/media`
- **Params:** `media_type=STORIES`, `image_url` or `video_url`.
- **CRITICAL:** If `media_type` is omitted, it will post to the feed instead of stories!
- **Specs:** Maximum 60 seconds. Captions are ignored.

## 3. Facebook Publishing Flow
Facebook uses specific endpoints on the Page node. It does not use the Instagram container approach.

### FB Posts (Feed)
- **Endpoints:** `POST /{page-id}/feed` (text/links), `POST /{page-id}/photos` (images), `POST /{page-id}/videos` (videos).

### FB Reels
- **Endpoint:** `POST /{page_id}/video_reels`
- **Workflow:** Resumable upload session (Initialize session -> Upload MP4 -> Publish).

### FB Stories 🚨
Do not use standard feed endpoints for stories!
- **Image Story Endpoint:** `POST /{page-id}/photo_stories` with `url` param.
- **Video Story Endpoint:** `POST /{page-id}/video_stories`. This requires a multi-step upload session (`upload_phase=start`, `transfer`, `finish`).
- **Specs:** Maximum 60 seconds. Guaranteed story placement only occurs via these specific endpoints.
