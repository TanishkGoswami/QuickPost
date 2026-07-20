# Trend Page TODO

✅ Phase 0 done - Supabase `posts` schema, env placeholders, and quota-aware YouTube client wrapper.

## Phase 1 - YouTube ingestion
- [x] Cron worker: pull `chart=mostPopular` by region/category
- [x] Normalize into common `posts` schema
- [ ] Dedup by source_url/content hash before insert
- [ ] Confirm rows landing correctly in Supabase

## Phase 2 - Feed API
- [ ] Cursor-based pagination endpoint (not offset)
- [ ] Ranking v1: `recency_decay * engagement_velocity`
- [ ] Redis cache for hot feed pages

## Phase 3 - Frontend infinite scroll
- [ ] Next.js feed page, IntersectionObserver-triggered fetch
- [ ] List virtualization
- [ ] Per-user `seen_post_ids` exclusion
- [ ] Embed rendering (official embeds, no rehosted media)

## Phase 4 - Reddit ingestion
- [ ] OAuth setup, subreddit puller, same normalize/dedup pipeline

## Phase 5 - Bluesky firehose
- [ ] WebSocket consumer, filter/normalize into `posts`

## Phase 6 - Personalization
- [ ] Claude API call per post: niche + format tagging
- [ ] Onboarding: user picks niches
- [ ] Ranking v2: add `niche_match_boost`

## Phase 7 - Engagement features
- [ ] Save/collections (boards)
- [ ] "Remix idea" AI suggestion button

## Phase 8 - Business decision
- [ ] Flag to human: evaluate paid aggregator (IG/TikTok/X) once budget exists
