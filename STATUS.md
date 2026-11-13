# STATUS

Last updated: 2026-11-14 (foundation).

## Works (verified on this machine)
- `pnpm install`, `pnpm typecheck` (shared, checks, api, web), `pnpm test` (checks: 3 tests; api: 5 tests incl. job-queue SKIP LOCKED and contract checks).
- `pnpm dev`: starts local Postgres, migrates, seeds, runs api + worker + web. `GET /health`, `GET /suppliers` (10 seeded), `/test-notice` (page and edit), web proxy `/api/*`.
- SSE: a `publish()` from another process reaches `GET /stream` (Postgres LISTEN/NOTIFY).
- Job queue: enqueue, claim, retry with backoff, stale re-queue; the worker fails jobs with no handler loudly.
- `source()` adapter: LIVE -> REC -> SEED, runs with no keys, mode on every result.

## Stubbed / not built yet
- All live provider calls (`contextdev`, `exa`, `cala`, `gemini` `live()` throw "not implemented"); only seed lookups work. No vendor has been called. No keys exist yet.
- Routes returning 501: `POST /suppliers/resolve`, `POST /suppliers/:edgeId/choose`, `POST /webhooks/contextdev`, `GET /events`, `GET /alerts`, `GET /incidents/:id`, `GET /incidents/:id/alternatives`, `POST /candidates/:id/approve`.
- No job handlers registered yet.
- `packages/checks` C1..C5 return UNKNOWN ("not implemented"); only the nested-region helper is real.
- Web is a minimal shell (health, supplier list, raw SSE list).

## Seeded (all labelled SEEDED / mode SEED; fictional, `.example` domains)
Demo client "Demo Dairy Oy", 10 suppliers (3 touch Rotterdam: Nordpack, Rhine Foils, Antwerp Resins via an INFERRED key), 4 candidates (1 VERIFIED, 2 FAILED, 1 UNVERIFIED by design), 2 tier-2 suppliers, a TEST notice page. Seeded suppliers stay RESOLVED, not MONITORED, until Ingest really arms a watch.

## Known issues / notes
- API reality check is unverified against live services (see `docs/api-findings.md`).
- Dev environment note: Docker is not installed on this machine; the local fallback cluster uses port 5434. An earlier throwaway Postgres on port 5433 (from a first attempt) was left running as an orphan process and can be closed from Task Manager.

## Next
Ingest, Onboarding, Engine and UI threads build against `PLAN.md`; get keys and do the first live call per vendor.
