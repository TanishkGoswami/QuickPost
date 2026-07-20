# Trend Page Architecture

## Data
- `public.posts` is the canonical normalized inspiration item table across source platforms.
- External-source dedupe starts at `source_url`; ingestion can add stronger content-hash handling when the worker exists.
- `pgvector` is enabled now, with `embedding vector(1536)` reserved for later personalization/tag similarity.

## Execution
- Phase work follows `TODO.md` order.
- Paid APIs, scraping/ToS risk, Supabase data deletion, or architecture conflicts must stop in `BLOCKERS.md`.
- Trend source credentials stay server-side in `server/.env`; the frontend only receives Supabase anon config and API base URLs.
- YouTube ingestion starts from `server/src/services/trendYoutubeClient.js`, using official `videos.list?chart=mostPopular` and a 10,000-unit daily budget guard.
- The YouTube cron worker is a separate server process at `server/src/workers/trendYoutubeWorker.js`; the API server does not own ingestion scheduling.
- `server/src/services/trendPostNormalizer.js` maps platform payloads into `public.posts`; AI-generated niche tags are intentionally empty until Phase 6.
- `content_hash` is generated server-side from stable normalized post fields and enforced with a partial unique index.
- Feed API ranks a bounded recent candidate pool with `recency_decay * engagement_velocity` and paginates using `rank_score desc, id desc`.
- Feed page responses cache in Redis when `REDIS_URL` or `BULLMQ_REDIS_URL` is configured; missing/unavailable cache falls back to Supabase.
