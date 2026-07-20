# Blockers

## 2026-07-20 - Phase 1 Supabase row confirmation

Blocked on confirming rows landing correctly in Supabase.

- Local Supabase is not running; `npx.cmd supabase status` cannot reach Docker Desktop.
- `YOUTUBE_DATA_API_KEY` is now set locally and the real YouTube pull reaches the insert path.
- The configured Supabase project does not have `public.posts` available yet; smoke insert failed with `PGRST205` / "Could not find the table 'public.posts' in the schema cache".
- Do not run `supabase db push` from this checkout without review: the worktree contains an untracked `202607200001_drop_trend_intelligence.sql` migration and AGENTS.md requires a hard stop before Supabase data deletion.

Next safe options:
- Start local Supabase/Docker and apply migrations, then run a local smoke insert.
- Review/apply only the non-destructive Trend schema migrations (`202607200002_create_trend_posts.sql`, `202607200003_add_posts_content_hash.sql`) to the intended Supabase project, then rerun the one-row smoke insert.
