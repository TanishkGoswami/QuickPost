# TREND PAGE — Codex Working Rules


> automatically every session — no need to re-paste it.

## What we're building

An infinite-scroll "trend/inspiration" feed page for **getaipilot.in** (Metabull
Universe). Content creators scroll trending posts/ideas pulled from YouTube,
Reddit, Bluesky (later a paid aggregator for IG/TikTok/X). Pinterest-style scroll,
never repeats, always fresh.

**Standard for everything**: production-ready, scalable, responsive, proper error
handling and typing. No placeholder logic left in shipped code. Explain non-obvious
decisions in Hinglish (kya + kyun) in commit messages, not code comments.

## Stack (locked, don't re-litigate)

- Backend: Node.js workers/cron (or Supabase Edge Functions)
- DB: Supabase Postgres + `pgvector`
- Cache: Redis (Upstash serverless)
- Frontend: Next.js + React, `react-intersection-observer` for infinite scroll,
  `react-window`/`react-virtual` for virtualization
- AI tagging: Claude API (niche/format classification per post)
- Sources live: **YouTube Data API (key enabled ✅)**. Next: Reddit (free tier,
  non-commercial only), Bluesky firehose (free, no key needed)

## Working loop (what to do on every `/goal` run)

1. Read `TODO.md` and `PROGRESS.md` first — they are the memory across sessions,
   not your context window.
2. Take the top unchecked task from the current phase. Don't skip ahead to a later
   phase even if it looks easier.
3. Check `ARCHITECTURE.md` before creating tables, endpoints, or conventions —
   don't duplicate or contradict what's already decided.
4. Implement fully: error handling, loading states, responsive UI, rate-limit
   handling for external APIs.
5. Verify: run build/lint, actually exercise the flow — don't just check it
   compiles.
6. Update `TODO.md` (check off + add discovered subtasks), `PROGRESS.md`
   (2-3 lines, dated), and `ARCHITECTURE.md` if something structural changed.
7. Commit with a one-line what+why message.
8. Move to the next task and repeat, until the phase is done or you hit a blocker.

**Keep docs thin.** `PROGRESS.md` is a log, not a diary — 2-3 lines per session.
`TODO.md` collapses a finished phase into one "✅ Phase N done" line instead of
20 checked boxes. If any file passes ~150 lines, prune it before continuing.

## Hard stops — write to `BLOCKERS.md` and stop, don't guess

- Any paid API integration (cost implication)
- Any scraping of a platform whose ToS prohibits it, even via a wrapper
- Any Supabase data deletion without a confirmed backup step
- Any architectural choice that contradicts `ARCHITECTURE.md`

## Phase plan (seed into TODO.md)

**Phase 0 — Setup**
- [ ] Supabase schema: `posts` table (id, source_platform, source_url,
      embed_html, thumbnail_url, caption, engagement_score, niche_tags[],
      published_at, ingested_at) + `pgvector` enabled
- [ ] Env vars wired (YouTube API key, Supabase keys)
- [ ] YouTube API client wrapper (quota-aware, 10k units/day)

**Phase 1 — YouTube ingestion**
- [ ] Cron worker: pull `chart=mostPopular` by region/category
- [ ] Normalize into common `posts` schema
- [ ] Dedup by source_url/content hash before insert
- [ ] Confirm rows landing correctly in Supabase

**Phase 2 — Feed API**
- [ ] Cursor-based pagination endpoint (not offset)
- [ ] Ranking v1: `recency_decay × engagement_velocity`
- [ ] Redis cache for hot feed pages

**Phase 3 — Frontend infinite scroll**
- [ ] Next.js feed page, IntersectionObserver-triggered fetch
- [ ] List virtualization
- [ ] Per-user `seen_post_ids` exclusion
- [ ] Embed rendering (official embeds, no rehosted media)

**Phase 4 — Reddit ingestion** (free tier, non-commercial cap — flag before scale)
- [ ] OAuth setup, subreddit puller, same normalize/dedup pipeline

**Phase 5 — Bluesky firehose**
- [ ] WebSocket consumer, filter/normalize into `posts`

**Phase 6 — Personalization**
- [ ] Claude API call per post: niche + format tagging
- [ ] Onboarding: user picks niches
- [ ] Ranking v2: add `niche_match_boost`

**Phase 7 — Engagement features**
- [ ] Save/collections (boards)
- [ ] "Remix idea" AI suggestion button

**Phase 8 — Business decision, not auto-build**
- [ ] Flag to human: evaluate paid aggregator (IG/TikTok/X) once budget exists
