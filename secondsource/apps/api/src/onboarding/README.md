# apps/api/src/onboarding

**Owner: Onboarding thread.** Paste flow: `POST /suppliers/resolve` -> PENDING rows -> `resolve_supplier` jobs -> resolver score -> `extract_footprint` -> watch registered -> MONITORED. SSE `supplier.status` on every change.

| File | What |
|---|---|
| `index.ts` | routes (`/suppliers`, `/suppliers/:edgeId`, `/suppliers/resolve`, `/suppliers/:edgeId/choose`) and job handlers |
| `pipeline.ts` | create rows, resolve, choose, footprint extraction, `armWatch` |
| `lookup.ts` | candidate gathering through `source()`: contextdev + cala, exa fallback; adds the seed catalog only on SEED answers |
| `scoring.ts` / `similarity.ts` | pure: 0.5 name + 0.2 country + 0.3 source agreement; bands 0.85 / 0.6; near-tie guard |
| `demoCatalog.ts` | fictional `.example` companies (SEED) and `DEMO_PASTE_LIST` (10 names: 7 clean, 1 ambiguous, 1 unresolvable, 1 with typed domain) |

Rules kept: SEEDED keys carry `seeded=true` and a fictional `.example` source URL; user-typed facts are INFERRED + seeded, never CONFIRMED; no data for a type = one UNKNOWN `?` placeholder; one supplier name per vendor call (never the client name or list).

Chooser: AMBIGUOUS rows list `options` (`companyId` is null if the company is not stored yet; then `POST /choose {domain}`). UNRESOLVED rows need `POST /choose {domain}`.

MONITORED means a POLL registration row in `supplier_edge.monitors` pointing at the TEST notice page (what Ingest actually polls today). `armWatch()` in `pipeline.ts` is the seam for Ingest's `arm_monitors` later.

Tests: `pnpm --filter @secondsource/api exec vitest run src/onboarding` (pure scoring; end-to-end over HTTP with the queue drained in-process; needs the DB). Run alone or with `--no-file-parallelism`, since `foundation.test.ts` clears the job table.
