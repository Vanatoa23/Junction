# apps/web

**Owner: UI thread.** React + Vite. Types come from `@secondsource/shared`; the API base is `/api` (Vite proxy to the API, prefix stripped). Run with the rest of the stack via `pnpm dev`, or alone with `pnpm --filter @secondsource/web dev` (port 5173).

## Screens (hash routes)

| Route | Screen |
|---|---|
| `#/suppliers` | Paste grid (name, domain, country), row status pending → resolved → monitored over SSE, footprint chips with state (✓ confirmed, ~ inferred, ? unknown, S seeded), source links, chooser for AMBIGUOUS rows, domain field for UNRESOLVED rows |
| `#/feed` | Live feed: events and alerts, source URL, verbatim quote, per-stage latency chips (`t_source`, `t_received`, `t_classified`, `t_alert`), `poll` / `webhook` and mode badges, dropped events logged |
| `#/incident[/:id]` | Incident footprint keys with evidence, unmapped names, affected suppliers |
| `#/alternatives[/:incidentId/:edgeId]` | Candidates grouped Verified / Unverified / Excluded, C1..C5 plus live news table with PASS / FAIL / UNKNOWN pills and evidence links, Approve only for verified, stored audit record |
| `#/test` | TEST notice page: link, "how to trigger the live change", editor (PUT `/test-notice`) |

## Honesty rules in the UI
- A mode badge (LIVE / REC / SEED / LOCAL) is shown wherever data appears; SEEDED is shown on seeded facts; TEST on anything from the TEST page; `poll` when `via=POLL`.
- Unknown is shown as unknown and never as a pass; Approve is disabled unless the verdict is VERIFIED.
- `t_source` shows "n/a" when the source gives no timestamp; the UI never invents one.

## Mock layer (UI-only, flagged)
`src/lib/mock.ts` is a typed stand-in for routes the backend has not built yet (same contract types, fictional `.example` data, mode SEED / LOCAL, never LIVE or REC).
- Data source selector in the top bar, or `?mock=0|1` in the URL:
  - **auto** (default): real backend first; a route falls back to the mock only if it is unreachable, 404, or 5xx (including 501 stubs).
  - **real only**: never mock; backend errors are shown.
  - **mock only**: no network calls at all (works with no backend).
- A **MOCK UI** banner lists exactly which routes were served by the mock. To remove the mock for good: delete `src/lib/mock.ts` and the `mockApi` fallbacks in `src/lib/api.ts`.
- In mock mode, publishing text on the TEST page drives an in-browser pipeline (about 2.5 s instead of a real poll): event, classified, three alerts, alternatives.

## Checks
`pnpm --filter @secondsource/web typecheck` and `pnpm --filter @secondsource/web build`.
