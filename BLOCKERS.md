# Blockers

## 2026-07-20 - Phase 1 Supabase row confirmation

Resolved after applying the non-destructive Trend schema SQL in Supabase and rerunning the smoke insert.

- Local Supabase is not running; `npx.cmd supabase status` cannot reach Docker Desktop.
- `YOUTUBE_DATA_API_KEY` is now set locally and the real YouTube pull reaches the insert path.
- The configured Supabase project initially did not have `public.posts` available; smoke insert failed with `PGRST205` / "Could not find the table 'public.posts' in the schema cache".
- Do not run `supabase db push` from this checkout without review: the worktree contains an untracked `202607200001_drop_trend_intelligence.sql` migration and AGENTS.md requires a hard stop before Supabase data deletion.
- Smoke result after user-applied SQL: `pulled=1`, `normalized=1`, `inserted=1`, `skipped=0`, `quotaUsed=1`.

## 2026-07-20 - Phase 4 Reddit live ingestion credentials

Blocked for live Reddit ingestion.

- The code uses Reddit's official OAuth API only.
- `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are required for app-token reads from `oauth.reddit.com`.
- User does not currently have Reddit app credentials because app creation is not working.
- Do not replace this with scraping, browser automation, or unofficial endpoints; that would create a ToS/scraping risk.
- Phase 4 code is implemented and test-verified, but live Reddit pulls must wait until official credentials are available or the user explicitly approves skipping Reddit live ingestion.
