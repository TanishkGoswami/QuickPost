# Blockers

## 2026-07-20 - Phase 1 Supabase row confirmation

Blocked on confirming rows landing correctly in Supabase.

- Local Supabase is not running; `npx.cmd supabase status` cannot reach Docker Desktop.
- `server/.env` has Supabase credentials, but no `YOUTUBE_DATA_API_KEY`, so the real YouTube ingestion pull cannot be exercised end to end from this checkout.
- Confirming with the configured Supabase project would require inserting a synthetic smoke row or running against remote data. Need human sign-off before writing test content to that database.

Next safe options:
- Start local Supabase/Docker and apply migrations, then run a local smoke insert.
- Add `YOUTUBE_DATA_API_KEY` and approve one remote smoke run against the configured Supabase project.
