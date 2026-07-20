# Trend Page TODO

✅ Phase 0 done - Supabase `posts` schema, env placeholders, and quota-aware YouTube client wrapper.

✅ Phase 1 done - YouTube `mostPopular` worker pulls, normalizes, dedupes, and writes to Supabase.

✅ Phase 2 done - Cursor feed API with ranking v1 and optional Redis hot-page cache.

Done Phase 3 - Dashboard Trend Feed page with IntersectionObserver fetch, virtualization, seen-post exclusion, and official embeds.
- [x] Fix empty-state regression when all currently ingested posts are already marked seen.
- [x] Fix virtualized grid rendering so feed items are visible.

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
