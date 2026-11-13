# apps/api/src/engine (+ packages/checks)

**Owner: Engine thread.** Status: built. Pipeline `classify_event -> match_incident -> find_alternatives`, plus routes.

## What it does
| Step | File | Behaviour |
|---|---|---|
| classify_event | `classify.ts` | `source(gemini.classify)` (rule-based SEED without a key). `verifyQuote()` runs in code. Not an incident: event CLASSIFIED. Bad quote / bad output: event DROPPED with `drop_reason` (logged). OK: `incident` + footprint keys (source URL = the event's), event INCIDENT, `t_classified` set, `match_incident` queued. Keys whose own quote fails verification are dropped. |
| match_incident | `match.ts`, `matching.ts` | Nested-region matching against tier-1 suppliers. One `alert` per (incident, supplier), `t_alert` set, SSE `alert.created`, `find_alternatives` queued per alert. **Blocked (no alert)**: unmapped names (needs a human), UNCONFIRMED incident, no keys. |
| find_alternatives | `alternatives.ts`, `liveNews.ts` | Candidates = seeded pool in the same category. C1..C5 (`packages/checks`) + LIVE_NEWS. Verdict, ranking, `candidate` + `check_result` rows, SSE `alternatives.ready`. |
| approve | `approve.ts` | Only PROPOSED + fully passing; verdict **recomputed from stored checks**; one `approval_audit` row with a snapshot. |

## Routes
`GET /alerts`, `GET /incidents` (extra: includes `unmappedNames`), `GET /incidents/:id`, `GET /incidents/:id/alternatives?edgeId=&limit=`, `POST /candidates/:id/approve` (409 `not_verified` / `not_proposed`), `POST /incidents/:id/mapping` (extra: a person supplies keys for unmapped names; stored SEEDED; re-queues matching). Engine-only schemas for the two extras are in `schemas.ts`.

## Decisions to know
- **Confirmation:** incidents from the TEST page (`event.is_test`) are CONFIRMED (the page stands in for an official notice, labelled TEST). Everything else is UNCONFIRMED and never alerts until a corroboration step exists.
- **Alert/candidate mode** = least-live of the inputs (SEED > LOCAL > REC > LIVE). A LOCAL fetch classified by the SEED classifier is SEED.
- **LIVE_NEWS** is stored as a row. Not run (no Context.dev key) = UNKNOWN with the reason "not run (SEED stand-in)"; it does **not** downgrade the verdict. A LIVE_NEWS FAIL excludes the candidate. Live parsing is UNVERIFIED.
- **All candidates are stored and returned, ranked** (VERIFIED, then UNVERIFIED, then FAILED; fewer FAILs/UNKNOWNs first). `?limit=3` gives the top 3. The seeded demo has four candidates (one VERIFIED, one UNVERIFIED on C5, two FAILED: Maasvlakte on C1+C2, Lodz on C5).
- **Check limits:** C5 compares ultimate-parent keys only (no 2-hop chain). C4 is UNKNOWN for a sanctions incident when the candidate has no sanction data. Evidence from seeded keys has no URL (seeded), so the `reason` carries the explanation.

## Run / test
```bash
pnpm --filter @secondsource/checks test          # 25 pure check tests
pnpm --filter @secondsource/api test             # needs the dev DB up and seeded
# demo: inserts a TEST event, runs the pipeline inline, prints alerts + candidate verdicts
pnpm --filter @secondsource/api exec tsx --env-file-if-exists=../../.env src/engine/demo.ts
```
Tests and the demo run handlers **inline** (`pipeline.ts`) so they never race a running worker. In the real app the worker runs the same functions via `index.ts` `jobHandlers`.
The demo script leaves its rows in the database (`pnpm db:reset` cleans a local DB).
