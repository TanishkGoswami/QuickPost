# Trend Page TODO

✅ Phase 0 done - Supabase `posts` schema, env placeholders, and quota-aware YouTube client wrapper.

✅ Phase 1 done - YouTube `mostPopular` worker pulls, normalizes, dedupes, and writes to Supabase.

✅ Phase 2 done - Cursor feed API with ranking v1 and optional Redis hot-page cache.

Done Phase 3 - Dashboard Trend Feed page with IntersectionObserver fetch, virtualization, seen-post exclusion, and official embeds.
- [x] Fix empty-state regression when all currently ingested posts are already marked seen.
- [x] Fix virtualized grid rendering so feed items are visible.
- [x] Render short feeds without virtual-scroll measurement.
- [x] Fix YouTube iframe player configuration error.

Done Phase 4 - Official Reddit OAuth app token, subreddit hot puller, normalizer, and shared dedup insert pipeline.

Done Phase 5 - Bluesky Jetstream WebSocket consumer filters post creates and writes normalized posts through shared dedupe.

## Phase 6 - Personalization
- [ ] Claude API call per post: niche + format tagging
- [ ] Onboarding: user picks niches
- [ ] Ranking v2: add `niche_match_boost`

## Phase 7 - Engagement features
- [ ] Save/collections (boards)
- [ ] "Remix idea" AI suggestion button

## Phase 8 - Business decision
- [ ] Flag to human: evaluate paid aggregator (IG/TikTok/X) once budget exists
