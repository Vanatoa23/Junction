# SecondSource MVP: plan

Source of truth for product decisions: the design recommendation (`report.html`). Fixed technical decisions are in the MVP spec and are not re-opened here. This file is the engineering plan and the **contract** the parallel threads build against. Contract changes go through the integrator only.

Purpose of the MVP: compare this idea with the other on a working thing. It must work end to end, show clearly what we are going for, and be a foundation we can keep building on (no throwaway hacks in the core).

## 0. Keyless mode (decision: no API keys for now)

The MVP runs entirely without keys and makes **no external calls**. It must showcase the idea and be trivial to switch on later.

- Providers: `contextdev`, `exa`, `cala`, `gemini` each have a deterministic **SEED** implementation and a **LIVE** implementation written against `docs/api-findings.md`, enabled only when the key env var is set (`CONTEXT_DEV_API_KEY`, `EXA_API_KEY`, `CALA_API_KEY`, `GEMINI_API_KEY`). LIVE code is **UNVERIFIED** (never run) and says so in code and docs.
- New mode **LOCAL** and provider **`local`** (`op: scrape`): fetches our own TEST page over HTTP. This makes the live-change flow genuinely work offline. The UI labels it LOCAL and "poll", never Context.dev. It refuses any other host.
- With no Gemini key the classifier is the deterministic **rule-based** one (`seed/classifier.ts`, `classifier: "rule-based-v1"`, mode SEED). It returns type, severity, footprint keys and a verbatim quote (`ClassifyOutput` in `packages/shared/src/classify.ts`), and the Engine **still runs `verifyQuote()`** (`apps/api/src/lib/quote.ts`) and drops failures.
- Honesty: every badge says LIVE / REC / SEED / LOCAL truthfully. Nothing seeded, rule-based or local is shown as live Context.dev or Gemini output.
- Ingest therefore builds the poll over `source({provider:"local", op:"scrape"})` first; swapping to `contextdev.scrape` when a key exists is a one-line change at the call site (same `{url}` -> text shape handling aside, see the op docs).

## 1. The one flow

1. Paste 5-10 suppliers (name, optional domain, optional country). Each is resolved and enriched (Context.dev company search; Exa and Cala as fallbacks). Row status: PENDING -> RESOLVED -> MONITORED, with source URLs.
2. Each supplier gets a footprint of REGION / PORT / PLANT / SANCTION / PARENT keys, each CONFIRMED / INFERRED / UNKNOWN with a source URL; seeded or user-typed facts are labelled SEEDED.
3. A TEST notice page we host is watched. **Default path: a scrape-and-diff poll every 30-60 s (UI says "poll")**, via the `local` provider without keys (mode LOCAL) or `contextdev.scrape` with a key (mode LIVE); the Context.dev monitor minimum interval is 10 minutes (see `docs/api-findings.md`). The signed webhook receiver feeds the same `ingestChange()` function. Editing the page produces an event.
4. Gemini classifies the change: type, severity, footprint keys, **verbatim quote**. Code checks the quote is a substring of the fetched text; otherwise the event is dropped and logged.
5. The incident footprint is matched against the client's suppliers (regions nested); an alert appears in the live feed with source URL, quote and latency `t_source`, `t_received`, `t_classified`, `t_alert`.
6. Alternatives: candidates (seeded pool, Exa if available) run C1 region, C2 port, C3 upstream plant, C4 sanction, C5 parent. Pure, unit-tested; **UNKNOWN never passes**. UI: per candidate a PASS / FAIL / UNKNOWN table with evidence links. Live news re-check is a stretch goal.
7. A human approves a fully passing candidate; an `approval_audit` row is written.

Out of scope: downstream/customer monitoring, Valio order, accuracy dashboard, PDF parsing, multi-user login. `client_id` stays on all private tables.

## 2. Architecture

```
apps/web (React+Vite) --/api--> apps/api (Fastify) --pg--> Postgres
                                   |  LISTEN sse  ^ NOTIFY sse
                       apps/api worker (job table, SKIP LOCKED)
                                   |
                   source() adapter -> contextdev | exa | cala | gemini  (LIVE | REC | SEED)
packages/shared (Zod contract)   packages/checks (pure C1..C5)
```

- API and worker are separate processes sharing code. Modules (`ingest`, `onboarding`, `engine`) each export a `ModuleDef` (`apps/api/src/module.ts`): routes plus job handlers. `apps/api/src/modules.ts` is the registry.
- SSE is cross-process: anyone calls `publish()` (`apps/api/src/bus.ts`), which does `pg_notify`; the API process LISTENs and fans out to `GET /stream`. Keep payloads under ~7 kB.
- Postgres is the only datastore. Env-only switch to Aiven: `DATABASE_URL` plus `DATABASE_SSL=require`.

## 3. Shared contract

All of it lives in `packages/shared/src` (Zod; types inferred). Read these files, they are commented:

| File | Contents |
|---|---|
| `footprint.ts` | `FootprintKey` {type, value, state, sourceUrl, sourceQuote, seeded}, value formats, the UNKNOWN placeholder rule |
| `domain.ts` | `Company`, `SupplierRow`, `Event`, `Incident`, `Alert`, `Candidate`, `CheckResult`, `ApprovalAudit`, `Latency`, `SourceMode`, `Evidence` |
| `api.ts` | request/response schemas for every route |
| `sse.ts` | `SseEnvelope`: `supplier.status`, `event.received`, `alert.created`, `alternatives.ready` |
| `jobs.ts` | job kinds and payload schemas |

### Database (`apps/api/migrations/001_init.sql`)
Tables: `client`, `company`, `footprint_key`, `event`, `incident`, `supplier_edge`, `alert`, `candidate`, `check_result`, `approval_audit`, `job`, `test_notice`.
- Public fact tables (no `client_id`): `company`, `footprint_key`, `event`, `incident`, `test_notice`.
- Private (`client_id NOT NULL`): `supplier_edge`, `alert`, `candidate`, `check_result`, `approval_audit`. `job.client_id` is nullable (some jobs are public).
- DB-level honesty guards: a footprint key needs a `source_url` unless `seeded` or UNKNOWN; UNKNOWN keys must have value `?`; an `incident` row requires `quote_verified = true`; `mode` is `NOT NULL` with `LIVE|REC|SEED` on every table that holds fetched or derived facts.
- `approval_audit` is append-only. New schema changes are new numbered migrations.

### Routes (served at root; web proxies `/api/*`)
| Route | Owner | State |
|---|---|---|
| `GET /health` | Foundation | works |
| `GET /stream` (SSE) | Foundation | works |
| `GET /suppliers`, `GET /suppliers/:edgeId` | Onboarding | works (reads seeded + resolved rows) |
| `POST /suppliers/resolve`, `POST /suppliers/:edgeId/choose` | Onboarding | 501 |
| `GET/PUT /test-notice`, `GET /test-notice/state`, `POST /test-notice/edit` | Ingest | works (scaffold) |
| `POST /webhooks/contextdev`, `GET /events` | Ingest | 501 |
| `GET /alerts`, `GET /incidents/:id`, `GET /incidents/:id/alternatives`, `POST /candidates/:id/approve` | Engine | 501 |

### Cross-cutting rules
1. **Every vendor call goes through `source()`** (`apps/api/src/source`). Result carries `mode` (LIVE | REC | SEED), `sourceUrls`, `latencyMs`, `note`. Callers persist the mode; the UI shows it. Order: LIVE (key + `SOURCE_MODE=auto`) -> REC fixture -> SEED provider -> `ok:false`. Never throws, never invents data (gemini has no seed).
2. Nothing seeded or recorded may be shown as live. Every real fact carries a source URL.
3. Unknown never counts as a pass. Unknown placeholder keys (`value="?"`) on either side give UNKNOWN.
4. Incident quote must be a whitespace-normalised substring of the fetched text, verified in code.
5. Incidents from the TEST page are `is_test=true` and labelled TEST everywhere.
6. Searches to Exa/Cala/Context.dev never include the client name or supplier list.
7. No secrets in the repo; `.env` only.

## 4. Workstreams and acceptance criteria

### W0 Foundation (this commit)
Monorepo, schema, shared contract, `source()` adapter, job queue, SSE bus, seed, test page, `pnpm dev`, docs. **Done when** `pnpm install`, `pnpm typecheck`, `pnpm test` and `pnpm dev` run on a clean machine with no keys.

### W1 API reality check (parallel; owns only `docs/api-findings.md`)
Done: findings written, all DOCUMENTED, none VERIFIED-LIVE (no keys yet). Next: one live call per vendor when keys arrive; save sanitized fixtures.

### W2 Ingest (`apps/api/src/ingest`)
- A poll scheduler (worker) scrapes the watched URLs via `contextdev.scrape` (`maxAgeMs: 0`), diffs against the stored copy, ignores layout/timestamp-only changes.
- `POST /webhooks/contextdev`: verify `X-Context-Signature: t=<unix>,v1=<hex>` (HMAC-SHA256 of `"t." + rawBody`, key = full `whsec_...` secret, 5 min tolerance), dedupe on `X-Context-Id`, respond 202 fast.
- One shared `ingestChange()` writes the `event` row (raw payload, `fetched_text`, `via`, mode, timestamps), publishes `event.received`, enqueues `classify_event`.
- Editing `/test-notice` produces an event within one poll interval. UI chip says "poll" for POLL.
- `GET /events`. Test: unit-test signature verification and diff; manual: edit page, see event.

### W3 Onboarding (`apps/api/src/onboarding`)
- `POST /suppliers/resolve` creates PENDING `supplier_edge` rows, enqueues `resolve_supplier`, publishes `supplier.status` as rows progress.
- Resolver score: 0.5 name similarity + 0.2 country + 0.3 domain agreement across sources; >= 0.85 auto, 0.6-0.85 AMBIGUOUS with options, < 0.6 UNRESOLVED.
- Footprint extraction writes `footprint_key` rows with source URL and state; unknowns stored as the placeholder.
- Status reaches MONITORED only when Ingest has really armed a watch. 10 names in under 60 s with keys; fully works on SEED.

### W4 Engine (`apps/api/src/engine`, `packages/checks`)
- `classify_event`: Gemini structured output, code quote check; failure sets `event.status=DROPPED` with `drop_reason`. Creates `incident` + incident footprint keys; names it cannot map go to `unmapped_names` and block auto-alert.
- `match_incident`: nested-region matching, one `alert` per affected supplier, `alert.created`, latency stamps.
- `find_alternatives`: candidates from the pool (+Exa), C1..C5, `verdictOf`, rank (VERIFIED first, then UNVERIFIED, then FAILED), `alternatives.ready`.
- `packages/checks`: pure functions, table-driven tests including nested regions, UNKNOWN-never-passes, shared parent.
- `POST /candidates/:id/approve`: 409 unless VERIFIED; writes `approval_audit` with snapshot.
- Seed demo must yield: Karlstad Pack VERIFIED, Maasvlakte Wrap FAILED (C1, C2), Tampere Board UNVERIFIED (C5), Lodz Pack FAILED (C5).

### W5 UI (`apps/web`)
Paste grid with status and mode badges, chooser for AMBIGUOUS, supplier detail with footprint keys and source links, live feed over SSE with latency chips and TEST/poll labels, incident view (quote, footprint, affected suppliers), alternatives check table with evidence links, Approve. Must render with only seed data.

### Integration (integrator)
Merge branches, run the whole flow after each merge, keep `STATUS.md` current, write `DEMO.md` and `MVP-SUMMARY.md`.

## 5. Ownership

| Area | Owner | Must not touch |
|---|---|---|
| `apps/api/src/ingest` | Ingest | everything else |
| `apps/api/src/onboarding` | Onboarding | everything else |
| `apps/api/src/engine`, `packages/checks` | Engine | everything else |
| `apps/web` | UI | everything else |
| `docs/api-findings.md` | API check | everything else |
| `packages/shared`, `migrations/`, `source/`, `db/`, `bus.ts`, `module.ts`, `modules.ts`, `seed/`, `scripts/`, root files | Integrator | threads propose changes, integrator applies |

Need a schema or contract change? Message the integrator with the exact change; do not edit shared files.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Audience reads SEED/LOCAL results as proof of the real APIs | Badges everywhere, STATUS and MVP-SUMMARY say exactly what is unverified; first keyed run is the next milestone |
| Monitor minimum interval is 10 min | Poll is the default live path and says "poll"; webhook is secondary. Only measured numbers shown. |
| API shapes are all DOCUMENTED, LIVE provider code UNVERIFIED | `docs/api-findings.md` tags every claim; first live call per vendor records fixtures; REC/SEED/LOCAL keep the app working |
| Gemini request shape is unsettled (docs conflict) | Use the SDK or try both shapes; model is `GEMINI_MODEL`; verify quotes in code |
| Public footprints are sparse (many UNKNOWN) | Fail closed; seeded labelled demo case; dense product category |
| Cala coverage for small Nordic firms unknown | Exa and Context.dev fallbacks; visible UNRESOLVED / UNKNOWN |
| Live stage change looks staged | TEST label, "poll" label; run real watches in parallel |
| Webhooks need a public URL | Tunnel locally; Aiven Runtime later |
| Free-tier credits and 10 req/min on core APIs | Cache, REC fixtures, `maxAgeMs: 0` only when freshness is needed |
| No Docker on this dev machine | `scripts/db.mjs` falls back to a private local Postgres cluster |
