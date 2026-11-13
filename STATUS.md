# STATUS

Last updated: 2026-11-14, after merging foundation, ingest, onboarding, engine, UI, e2e and docs onto `main`.

## Works (verified on this machine, no API keys)
- `pnpm install`, `pnpm typecheck` (4 packages), `pnpm test`: 25 checks tests and 63 API tests pass. API tests run against their own throwaway database (`<db>_test`, recreated and seeded each run), so they never touch dev data or race a dev worker.
- `pnpm dev`: Postgres (Docker if present, else a private local cluster on port 5434), migrate, seed, then api + worker + web.
- **Full flow, driven over HTTP on a fresh database and by clicking through the real UI (API: real only):**
  1. Paste the demo list: 10 rows, 8 reach MONITORED, 1 AMBIGUOUS (chooser works, then MONITORED), 1 UNRESOLVED (domain input). About 2 s.
  2. Edit the TEST page (UI or API): the poll sees the change, event is created (`via=POLL`, mode LOCAL, TEST), classified, quote verified in code, incident STRIKE/HIGH with `PORT:NLRTM` (confirmed) and `REGION:NL-ZH` (inferred).
  3. Alerts for every supplier touching Rotterdam, each with quote, source URL and `t_source` / `t_received` / `t_classified` / `t_alert`. Edit to alert 1.5 s with a 5 s poll.
  4. Alternatives for Nordpack: Karlstad Pack VERIFIED, Tampere Board UNVERIFIED (C5 unknown), Lodz Pack FAILED (C5), Maasvlakte Wrap FAILED (C1, C2). All four are returned, ranked.
  5. Approve: only Karlstad can be approved; the others get 409; an `approval_audit` row with a snapshot is written. Same in the UI (other Approve buttons disabled).
  6. SSE delivers `supplier.status`, `event.received`, `alert.created`, `alternatives.ready`.
- `pnpm e2e` (with `pnpm dev` up): 10 steps pass in about 3.2 s. Set `E2E_BASE_URL` and `DATABASE_URL` if the stack is not on the defaults.

## What is SEED, LOCAL, REC, UNVERIFIED
- **SEED:** all companies, footprints, resolver catalog, candidate pool and tier-2 suppliers are fictional (`.example` domains). The incident classifier is a deterministic rule-based stand-in (`rule-based-v1`), not an LLM.
- **LOCAL:** the TEST page watch (our own fetch and diff of our own page). Never presented as Context.dev.
- **REC:** none recorded yet (needs live keys; `SOURCE_RECORD=1`).
- **UNVERIFIED (never run against the real services):** live code for Context.dev (company search, scrape, news, monitors), Exa (search), Cala (entity search, ownership), Gemini (classify), and the signed webhook receiver. Flip each with one env var: `CONTEXT_DEV_API_KEY`, `EXA_API_KEY`, `CALA_API_KEY`, `GEMINI_API_KEY` (see README). Webhook also needs `CONTEXT_DEV_WEBHOOK_SECRET` and a public URL.
- **Not run:** live news re-check (interface exists; answers UNKNOWN "not run" without a key and does not change the verdict).

## Decisions made while integrating
- Alerts are created once per (client, company), so pasting the same supplier twice does not double alerts. The supplier grid still shows duplicate rows (no paste-level dedupe against existing rows).
- TEST-page incidents are CONFIRMED (the page stands in for an official notice, labelled TEST); anything else stays UNCONFIRMED and never alerts.
- Alert and candidate `mode` is the least-live of the inputs (SEED > LOCAL > REC > LIVE).
- Engine returns all four ranked candidates (not truncated to 3); `?limit=3` is available.
- `apps/web/vite.config.ts` proxies to `API_PORT` (default 3001) so the web app can follow a non-default API port.

## Known issues
- The 10 pre-loaded seeded suppliers stay RESOLVED (not MONITORED): nothing arms a watch for them. Only pasted rows reach MONITORED.
- Duplicate pastes create duplicate grid rows.
- On startup the first poll job can fail once if the API is not up yet; it retries and succeeds.
- C5 compares ultimate-parent keys only (no 2-hop chain). C4 is UNKNOWN for sanctions incidents without screening data.
- `api-findings.md` is documentation-only. No vendor has ever been called.
- Docker is untested on this machine (not installed); the compose file is unverified.

## Next
1. Keys: one live call per vendor, fix live providers, record fixtures (see `MVP-SUMMARY.md` for the effort estimate).
2. Webhook monitors and a public URL; real Gemini classification and footprint extraction.
3. Corroboration, live news check, accuracy funnel, second client with row-level security, Aiven deploy.
