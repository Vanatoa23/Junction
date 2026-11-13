# SecondSource API reality check

Checked 2026-11-14 from public docs. **No API keys exist in this environment** (no `.env`, no relevant env vars), and no `report.html` or spec file was present in `C:\Users\vanat\JunctionSupply` (the directory was empty), so I worked from the coordinator brief. **Nothing here is VERIFIED-LIVE.** Every claim is tagged:

- **DOCUMENTED**: stated on the vendor's official docs page (fetched via a summarizing tool, so exact wording and field names should be confirmed on first live call).
- **ASSUMED**: inferred, or docs conflicted or were silent.
- **VERIFIED-LIVE**: none yet.

## Keys Markus must supply

| Env var | Service | Where | Needed for |
|---|---|---|---|
| `CONTEXT_DEV_API_KEY` | Context.dev | docs.context.dev, account, API keys. The key needs the `monitors:write` scope, or the webhook `secret` is not returned. | Monitors, scrape, news, company search |
| `GEMINI_API_KEY` | Google AI Studio | aistudio.google.com | Classification with a verbatim quote |
| `EXA_API_KEY` | Exa | dashboard.exa.ai | Search, company category (Websets only if a paid plan) |
| `CALA_API_KEY` | Cala | console.cala.ai (free account) | Entity name search, ownership edges |

You also need a **public HTTPS URL** for the webhook receiver (ngrok or cloudflared tunnel, or the deployed host). Context.dev only delivers to public HTTP(S) URLs, so localhost will not work.

## Recommendation for the live demo

**Use a webhook monitor as the real pipeline, with a one-click "Run now"/scrape-diff fallback ready.**

- Minimum schedule is 10 minutes (DOCUMENTED), so a monitor will NOT fire on its own during a 3-minute stage demo. The reliable demo path is:
  1. Create the monitor ahead of time (baseline run is captured at creation and never reports a change).
  2. Edit the watched demo page, then trigger a run (the docs mention "Run now" on the monitor, but the endpoint path was not found, so check the API reference `docs.context.dev/api-reference/monitors/`). Webhook arrives, UI updates.
  3. Fallback if the webhook or tunnel fails: our own `POST /web/scrape` of the page, diff against the stored last copy, and feed the same ingest function the webhook handler uses. Build the webhook handler and the poll path to call one shared `ingestChange()`.
- Pre-record a real webhook delivery once keys exist and save it in `docs/fixtures/` so the UI can replay it offline.
- Delivery has retries (defaults 10s, 60s, 300s, 30min, 2h, 6h, 16h) and 7-day replay, which is also handy to re-send an event during the demo.

## Context.dev

Base URL `https://api.context.dev/v1`. Auth: `Authorization: Bearer $CONTEXT_DEV_API_KEY` (DOCUMENTED). Official SDKs exist for TS, Python, Ruby, Go, PHP (DOCUMENTED).

### Company enrichment
- **There is no single "enrich" endpoint documented.** Two options (DOCUMENTED):
  - `POST /company/search`: body `{ "query": "...", "mode": "fast"|"ultra", "filters": {"countries":["FI"],"employees_min":..,"employees_max":..}, "cursor": "..." }`. `fast` is about 2s and 2 credits, `ultra` up to 20s and 10 credits. Returns up to 10 results with `name, domain, description, socials{linkedin,...}, organization_type, operating_status, stock_symbols, industries, founded_year, revenue{min_usd,max_usd}, headquarters{country_code,region,city,...}, employees{count,min,max}, funding{total_usd,round_count,stage,latest_round,rounds}`, plus `next_cursor`, `request_id`, `key_metadata{credits_consumed,credits_remaining}`.
  - Brand lookups: by domain, name, email, ticker (`docs.context.dev/brand/lookup-by-domain.md`, etc.). Exact paths and response shapes not read (ASSUMED similar Bearer auth).
- Query is free text, so there is no guaranteed exact-domain match. ASSUMED: take the result whose `domain` matches the target.

### Page monitor + webhook (the key dependency)
Create: `POST /monitors` (DOCUMENTED). Body:
```json
{
  "name": "acme-supplier-terms",
  "target": {
    "type": "page",
    "url": "https://example.com/supplier-terms",
    "include_selectors": ["main"],
    "exclude_selectors": ["footer"],
    "instructions": "Alert me when ownership, sanctions, insolvency, or supply-relevant changes appear"
  },
  "change_detection": "semantic",
  "schedule": { "type": "interval", "frequency": 10, "unit": "minutes" },
  "webhook": { "url": "https://<public-host>/api/webhooks/contextdev", "retry": {} },
  "tags": ["secondsource"]
}
```
- Response `201`: `id, status, next_run_at, initial_run_id`, and `webhook{url, secret:"whsec_...", events:["change.detected"], retry{delays_seconds}}`. The secret is returned only to keys with `monitors:write`. Store it keyed by `monitor.id`; never log it. (DOCUMENTED)
- Target types: `page`, `sitemap`, `extract`, `search`. `instructions` (1 to 2000 chars) makes a page monitor semantic, with an LLM judge and a re-fetch to confirm before it fires. Without `instructions` it is exact: any text diff fires. (DOCUMENTED)
- **Minimum interval**: 10 minutes, 1 hour, 1 day via units `minutes` (min 10), `hours` (min 1), `days` (min 1). Default is daily. Only `interval` schedule type is supported today (a third-party page says cron and exact_time are reserved). (DOCUMENTED; plan restrictions not described, ASSUMED none beyond credits)
- Baseline: creation queues a baseline run which never reports a change. A first real change needs a second run. (DOCUMENTED)
- Browser `actions` on page monitors need a paid plan (`403 PAID_PLAN_REQUIRED`). Monitor count is plan-limited (`GET /monitors/limits`; plans free/starter/pro/scale). Paused monitors still count. (DOCUMENTED)
- Related: `POST /monitors/{id}/webhook/rotate-secret`, list/retry webhook deliveries (`/api-reference/webhooks/list`, `/retry`). "Run now" exists but its path was not documented in the pages I read (UNVERIFIED).

### Webhook payload and signature
- Events: `change.detected` (default), `run.completed` (every completed run, includes `data.run` and `data.change` or null; baseline and no-change runs too). Failed and skipped runs send nothing. Subscribe to both and you get two events per change. (DOCUMENTED)
- Envelope (DOCUMENTED, only top-level fields):
```json
{ "event": "change.detected", "id": "<stable event id>", "created_at": "...", "data": { "change": { ... } } }
```
- Headers: `X-Context-Id` (equals payload `id`, stable across retries, use for dedupe), `X-Context-Event`, `X-Context-Signature`.
- Change record fields (DOCUMENTED, "runs and changes" page): `id, monitor_id, run_id, title, summary, url, detected_at, tags, target_type, change_detection_type, diff` (`+`/`-` lines), `before_text_excerpt, after_text_excerpt` (exact monitors), `importance` (low/medium/high), `confidence` (0 to 1), `evidence` (semantic), `matched_urls, added_urls, removed_urls` (sitemap/search). A full sample body is NOT in the docs, so save the first real one as a fixture.
- Signature (DOCUMENTED):
  - `X-Context-Signature: t=<unix>,v1=<hex>`
  - `v1 = HMAC_SHA256(key = full secret string including "whsec_" (no base64 decode), data = "<t>." + rawBodyBytes)`, hex-encoded.
  - Reject if `|now - t| > 300s`. Use constant-time compare. Verify against raw bytes BEFORE JSON parsing (in Next/Express, read the raw body).
- Receiver must respond 2xx; non-2xx is `rejected`, no response is `failed`. After 3 consecutive failures the org gets an email. Webhook deliveries are rate limited to 600/min per org. (DOCUMENTED)

### Scrape
`POST /web/scrape` (DOCUMENTED). Body `{ "url": "https://...", "formats": {"markdown": true}, "maxAgeMs": 0 }`. **Cache default is 3 days, so pass `maxAgeMs: 0` for a fresh diff** (DOCUMENTED). Response `markdown: {requested, success, data}`, `metadata{title,description,...}`, `cache_metadata`, `key_metadata`, `request_id`. 1 credit to start. Other formats include html, screenshot, json, highlights, product.

### News search
`POST /news/search` (DOCUMENTED). Body e.g.
```json
{ "searchBy": {"type":"entity","entity":{"name":"Acme Oy","domain":"acme.fi"}}, "sortBy":{"type":"newest"}, "limit": 10 }
```
or `searchBy: {"type":"natural_language","query":"..."}` (2 to 1000 chars, always relevance-sorted). Filters: source domain, country, language, `articleType` (editorial, press_release, regulatory_filing, advisory), date range in epoch ms. Response `data[]` with `id, story_id, url, title, description, language, authors, published_at, type, source{name,domain}, match{level,confidence}`, plus `has_more, next_cursor`. Cost 1 credit per 10 results. The exact `searchBy.type` literal values are my reading of the summary (ASSUMED), so check the first call.

### Rate limits
- Free plan core data APIs: 10 req/min plus concurrency. Paid plans: concurrency slots per org. Monitors API 1000 req/min; webhook deliveries 600/min. 429 returns `Retry-After`, `X-RateLimit-*`. (DOCUMENTED)
- Free credit allowance and exact plan prices: not found (UNVERIFIED). Check "Plans and billing" before the demo so a quota does not skip runs (skipped runs when out of credits).

## Gemini (classification with a verbatim quote)

Auth header `x-goog-api-key: $GEMINI_API_KEY` (DOCUMENTED).

**Docs conflict, so treat the request shape as UNSETTLED until one live call.** Two shapes appear in the current docs:

1. generateContent, newest docs example (DOCUMENTED):
   `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with
   ```json
   { "contents":[{"parts":[{"text":"..."}]}],
     "generationConfig":{"responseFormat":{"text":{"mimeType":"APPLICATION_JSON","schema":{ ...JSON Schema... }}}} }
   ```
   JSON string expected at `candidates[0].content.parts[0].text` (ASSUMED from streaming examples).
2. Interactions API (DOCUMENTED): `POST /v1beta/interactions` with header `Api-Revision: 2026-05-20`, body `{ "model":"...", "input":"...", "response_format":{"type":"text","mime_type":"application/json","schema":{...}} }`, JSON in `output_text`.

The older shape, `generationConfig.responseMimeType: "application/json"` plus `responseJsonSchema` (a search snippet shows `ResponseJsonSchema` in the Go SDK) and the legacy `responseSchema`, very likely still works (ASSUMED). **Plan: implement via the `@google/genai` SDK (handles field naming), or try shape 1, then fall back to the older shape.**

- Model IDs (DOCUMENTED, models page): stable `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`; preview `gemini-3-flash-preview`. The docs also list Gemini 4 Hydrogen/Carbon/Argon. `gemini-2.5-flash` is deprecated (routes to 3.5 Flash-Lite on 2026-12-01). **Recommendation: `gemini-3.8-flash` for quality, `gemini-3.5-flash-lite` for speed/cost.** Make the model id an env var (`GEMINI_MODEL`).
- Schema support (DOCUMENTED): types string/number/integer/boolean/object/array/null, `enum`, `required`, `additionalProperties`, `minItems`/`maxItems`. `minLength`, `maxLength`, `uniqueItems` etc. are silently stripped. Overly complex or deeply nested schemas return `400 INVALID_ARGUMENT`. So keep the schema flat.
- **Verbatim-quote caveat (ASSUMED)**: schema enforces shape, not truth. The model can paraphrase the "quote". Always verify in code that `quote` is a substring of the source text (normalize whitespace); if it is not, retry once or mark unverified. Suggested schema: `{category: enum[...], confidence: number, quote: string, reasoning: string}`.
- Limits and free-tier quota: not found (UNVERIFIED).

## Exa

- Search: `POST https://api.exa.ai/search`. Auth `x-api-key: $EXA_API_KEY` or `Authorization: Bearer` (DOCUMENTED).
- Body: `query` (required), `type` (`auto` default, `lite`, `deep-lite`, `deep`), `numResults` 1 to 100, `category` (`company`, `people`, `news`, ...), `contents{text, highlights, summary, extras, maxAgeHours}`, `includeDomains/excludeDomains`, `outputSchema` (synthesized structured output, not with `lite`). Example: `{"query":"Acme Oy owner","category":"company","numResults":5,"contents":{"highlights":true}}` (DOCUMENTED).
- Response: `requestId, results[{title,url,publishedDate,author,id,image,favicon,text,highlights,summary,entities[]}], costDollars, searchTime, warnings`. Company category results can carry `entities` of type company with `name, foundedYear, description, workforce, headquarters, financials, webTraffic`. **`category:"company"` rejects `startPublishedDate`/`endPublishedDate` with 400** (DOCUMENTED).
- Rate limits: not found on the page (UNVERIFIED); OpenAPI spec at `https://exa.ai/docs/exa-spec.yaml`.
- Websets: `POST https://api.exa.ai/websets/v0/websets/` with `{ "search": {"query":"...","count":5}, "enrichments":[{"description":"...","format":"text"}] }`. Async; results by polling (`items.list`), or webhooks (`POST /v0/webhooks`, events like `webset.item.created`, `webset.idle`; secret returned on creation). Requires a **paid Websets plan**, separate Websets credits, free plan capped at 25 results. (DOCUMENTED) **Not recommended for the MVP: async, paid, slow. Use plain `/search` with `category:"company"`.**

## Cala

- Base `https://api.cala.ai/v1`. Auth header **`X-API-KEY`**. Keys at console.cala.ai, "free account" mentioned, quotas not stated. OpenAPI: `https://api.cala.ai/openapi.json`. Also an MCP server at `https://api.cala.ai/mcp`. (DOCUMENTED)
- **Name search**: `GET /v1/entities?name=Acme&entity_types=Company&limit=5` (name 1 to 100 chars, fuzzy). Response `{ "entities": [{ "id": "<uuid>", "name": "...", "entity_type": "Company", "description": "..." }] }`, most relevant first. Per the OpenAPI spec (DOCUMENTED).
- **Ownership data**: `POST /v1/entities/{entity_id}` with body like
  ```json
  { "properties": ["name","aliases","registered_address"],
    "relationships": { "outgoing": { "IS_ULTIMATE_PARENT": {"limit":10}, "IS_BOARD_MEMBER_OF": {} } } }
  ```
  Returns `id, name, entity_type, description, properties{value,sources[]}, relationships, numerical_observations`. Omitting the body returns default properties only, no relationships. **No dedicated ownership/subsidiary fields are documented**; the example relationship names `IS_ULTIMATE_PARENT` and `IS_BOARD_MEMBER_OF`. Which edges exist per entity must be discovered with `GET /v1/entities/{entity_id}/introspection`. Coverage for small Finnish/Nordic suppliers is ASSUMED unknown, so test with 3 to 5 real supplier names before relying on it. (DOCUMENTED / ASSUMED)
- Also: `POST /v1/entities/lookup` (resolve by identifier such as LEI/CIK), `POST /v1/knowledge/query` (JSON rows from Cala QL or natural language), `POST /v1/knowledge/search` (sourced markdown answer). 429 returns `rate_limit_exceeded`. Numeric limits not stated.

## Open risks / what to do the minute keys arrive

1. One live call each, record sanitized responses to `docs/fixtures/` (none recorded yet; nothing was run): `contextdev-company-search.json`, `contextdev-webhook-change-detected.json`, `gemini-classify.json`, `exa-company-search.json`, `cala-entity-search.json`.
2. Confirm the Gemini request shape and the exact "Run now" endpoint.
3. Confirm Context.dev free credits and monitor limit via `GET /monitors/limits` and the key's `key_metadata`.
4. Set up the public tunnel for the webhook receiver and test signature verification with the real `whsec_` secret before demo day.
5. Cache everything (scrape defaults to 3-day cache; set `maxAgeMs:0` only when you need freshness) to protect credits and the 10 req/min free limit.

## Sources (all fetched 2026-11-14)
docs.context.dev (overview, monitors/overview, monitors/schedules, monitors/webhooks, webhooks, monitors/runs-and-changes, monitors/targets/page, monitors/limits-and-errors, optimization/rate-limits, api-reference/company/search, news/search, web-scraping/scrape); aistudio.google.com/docs/structured-output and /docs/models (redirect targets of ai.google.dev); docs.exa.ai (reference/search, websets/api/overview, websets/api/webhooks/overview); docs.cala.ai (quickstart, api-reference/entities, llms.txt) and api.cala.ai/openapi.json.
