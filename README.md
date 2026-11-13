# SecondSource

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

Other commands: `pnpm db:migrate`, `pnpm db:seed` (idempotent), `pnpm db:reset` (local DB only), `pnpm db:down`, `pnpm typecheck`, `pnpm test` (the API tests need the database up).

### Adding keys
Put them in `.env` (never commit it): `CONTEXT_DEV_API_KEY`, `EXA_API_KEY`, `CALA_API_KEY`, `GEMINI_API_KEY`. Webhooks need a public URL: run a tunnel and set `PUBLIC_BASE_URL`. `SOURCE_MODE=rec|seed` forces offline modes; `SOURCE_RECORD=1` saves live responses as REC fixtures in `apps/api/fixtures/rec`.

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
