# Trend Page Architecture

## Data
- `public.posts` is the canonical normalized inspiration item table across source platforms.
- External-source dedupe starts at `source_url`; ingestion can add stronger content-hash handling when the worker exists.
- `pgvector` is enabled now, with `embedding vector(1536)` reserved for later personalization/tag similarity.

## Execution
- Phase work follows `TODO.md` order.
- Paid APIs, scraping/ToS risk, Supabase data deletion, or architecture conflicts must stop in `BLOCKERS.md`.
