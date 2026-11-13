# apps/api/src/ingest

**Owner: Ingest thread.** Live-change path: poll (default), signed webhook (second path), one shared `ingestChange()`.

| File | What |
|---|---|
| `ingest.ts` | `ingestChange()`: writes the `event` row (via, mode, raw, fetched_text, `t_source`, `t_received`), publishes SSE `event.received`, enqueues `classify_event` (Engine owns the handler). Also the `GET /events` query. |
| `poll.ts` | `pollOnce()` scrape-and-diff over `source({provider:"local", op:"scrape"})` (mode **LOCAL**, UI says "poll"). The worker scheduler (`startWorker`) enqueues a `poll_page` job every `INGEST_POLL_INTERVAL_MS` (default 10 s dev, 45 s with `NODE_ENV=production`). The first poll stores a baseline and emits nothing. |
| `diff.ts` | normalise (drops "Last updated:" lines and whitespace, so timestamp/layout-only changes are ignored), hash, line diff, `parseLastUpdated` (the TEST page's own timestamp = honest `t_source`). |
| `signature.ts` | `X-Context-Signature` `t=,v1=` HMAC-SHA256 over `"t.rawbody"`, 5 min tolerance, constant-time. **UNVERIFIED against the real service.** |
| `webhook.ts` | `POST /webhooks/contextdev`: raw-body parser scoped to the route, verifies, dedupes on `X-Context-Id` (unique index on `event.raw->>'contextId'`), 202. 503 when `CONTEXT_DEV_WEBHOOK_SECRET` is empty. Only `change.detected` creates an event. |

Routes: `GET /events?limit=`, `POST /webhooks/contextdev`, `POST /dev/poll-now` (dev: poll the TEST page immediately; returns `baseline|unchanged|changed|error`).

Honesty: poll events are `via=POLL, mode=LOCAL, is_test=true`; `t_source` is the page's own "Last updated" stamp (null if absent). Webhook events are `via=WEBHOOK, mode=LIVE` with `raw.unverified=true` until a real delivery has been seen.

Switching to Context.dev later: change `provider` in `pollOnce` to `contextdev` (scrape, `maxAgeMs:0`) and adapt markdown to `text`. For the webhook, put the monitor's `whsec_` secret in `CONTEXT_DEV_WEBHOOK_SECRET` and expose a public URL.

Migration `003_ingest.sql` (additive): `watch_snapshot` table and the dedupe index.
