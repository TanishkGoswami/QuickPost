# Blockers

## 2026-07-20 - Phase 1 Supabase row confirmation

Resolved after applying the non-destructive Trend schema SQL in Supabase and rerunning the smoke insert.

- Local Supabase is not running; `npx.cmd supabase status` cannot reach Docker Desktop.
- `YOUTUBE_DATA_API_KEY` is now set locally and the real YouTube pull reaches the insert path.
- The configured Supabase project initially did not have `public.posts` available; smoke insert failed with `PGRST205` / "Could not find the table 'public.posts' in the schema cache".
- Do not run `supabase db push` from this checkout without review: the worktree contains an untracked `202607200001_drop_trend_intelligence.sql` migration and AGENTS.md requires a hard stop before Supabase data deletion.
- Smoke result after user-applied SQL: `pulled=1`, `normalized=1`, `inserted=1`, `skipped=0`, `quotaUsed=1`.
