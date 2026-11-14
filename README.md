# SecondSource

Live monitoring of supply-chain risk: your direct suppliers on a map, coloured green / yellow (early warning) / red (needs attention now), with the risk of their own suppliers worked out in the background. See `VISION.md` for the aim and `DEMO.md` for the 3-minute script.

Live supply-chain risk monitor: it watches the sources your suppliers depend on, turns a change into a typed incident, and only offers replacement suppliers that the same incident cannot touch. See `PLAN.md` (plan and contract), `STATUS.md` (what works, what is mocked), `docs/api-findings.md`.

## Run it

Requirements: Node 20+, pnpm 9 (`npm i -g pnpm`), and either Docker or a local PostgreSQL 14+ install.

```bash
pnpm install
pnpm dev
```

`pnpm dev` creates `.env` from `.env.example` if missing, starts Postgres, migrates, seeds, then runs api, worker and web:

| Thing | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 (`/health`, `/suppliers`, `/stream`) |
| TEST notice page (editable, labelled TEST) | http://localhost:3001/test-notice |

It runs with **no API keys**: every vendor call falls back to a recorded response (REC) or seed data (SEED), and the UI labels which.

### Database
- With Docker: `docker compose up -d db` (done for you by `pnpm dev`).
- Without Docker: `scripts/db.mjs` starts a private cluster in `.data/pgdata` using locally installed PostgreSQL binaries. Port 5434, trust auth, localhost only.
- Aiven later: set `DATABASE_URL` (and `DATABASE_SSL=require`). Nothing else changes.

Other commands: `pnpm db:migrate`, `pnpm db:seed` (idempotent), `pnpm db:reset` (local DB only), `pnpm db:down`, `pnpm typecheck`, `pnpm test` (API tests use their own throwaway `<db>_test` database and need Postgres up), `pnpm e2e` (full flow check against a running `pnpm dev`; honours `E2E_BASE_URL` and `DATABASE_URL`). `API_PORT` changes the API port and the web proxy follows it; `INGEST_POLL_INTERVAL_MS` sets the TEST-page poll interval (10 s in dev). See `DEMO.md` for the 3-minute click-through.

### Keyless by default, easy to switch on
No keys are needed. Each provider answers from deterministic seed data (mode SEED). Setting one env var in `.env` (never commit it) flips that provider to LIVE for its ops, and nothing else changes:

| Env var | Provider | Without it (default) | With it |
|---|---|---|---|
| `CONTEXT_DEV_API_KEY` | `contextdev`: company search, scrape, news, monitors | SEED company lookup; TEST page is watched by the `local` provider instead | LIVE |
| `EXA_API_KEY` | `exa`: search / candidate discovery | SEED candidate pool | LIVE |
| `CALA_API_KEY` | `cala`: entity search, ownership | SEED ownership | LIVE |
| `GEMINI_API_KEY` (+ `GEMINI_MODEL`) | `gemini`: incident classification. Optional and off: Gemini is not part of the product for now (see `VISION.md`) | Deterministic rule-based classifier (`rule-based-v1`, not an LLM), SEED | LIVE |

**The LIVE code paths are UNVERIFIED**: they are written from `docs/api-findings.md` and have never run against the real services. Expect to fix field names on the first live call. `SOURCE_RECORD=1` saves each live response as a REC fixture in `apps/api/fixtures/rec`; `SOURCE_MODE=rec|seed` forces offline modes even when keys exist.

The `local` provider (no key, mode LOCAL) fetches our own TEST page over HTTP so the live-change flow genuinely works offline. It only fetches our own host and is never labelled Context.dev. Webhooks (a later, keyed path) need a public URL: run a tunnel and set `PUBLIC_BASE_URL`.

Badges in the UI: LIVE (real vendor call now), REC (recorded real response), SEED (seed or rule-based stand-in), LOCAL (our own code on our own host).

## Layout

```
apps/api        Fastify server (src/server.ts) + worker (src/worker.ts)
  src/ingest      monitors, webhook, poll, TEST page        (Ingest thread)
  src/onboarding  paste flow, resolver, footprints          (Onboarding thread)
  src/engine      classifier, matching, alternatives        (Engine thread)
  src/source      the only place vendors are called
  src/db          pool, migrations runner, job queue, mappers
  migrations      plain SQL, numbered
apps/web        React + Vite                                 (UI thread)
packages/shared Zod contract: types, routes, SSE, jobs
packages/checks Pure C1..C5 checks                           (Engine thread)
```

## Honesty rules
Nothing seeded or recorded is shown as live. Every real fact shows its source URL. Unknown never counts as a pass. The TEST page is always labelled TEST, and the demo companies use `.example` domains.
