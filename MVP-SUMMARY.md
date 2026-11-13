# MVP summary (SecondSource)

Purpose: compare this idea with the other on a working thing. State: `main` at the integration commit; details in `STATUS.md`, click-through in `DEMO.md`.

## What works, and what each part really is

The whole flow runs end to end on one command (`pnpm dev`) with no API keys, and `pnpm e2e` drives it in about 3 s: paste suppliers, resolve and footprint them, edit the TEST page, detect the change, classify it with a code-checked verbatim quote, match it to suppliers (nested regions), raise alerts with per-stage latency, check alternatives (C1 to C5), approve with an audit row.

| Part | Mode today | Honest label |
|---|---|---|
| Supplier resolution, chooser, footprints | **SEED** | Fictional companies from a seed catalog; scoring (0.5 name, 0.2 country, 0.3 source agreement) and the chooser are real code |
| Watching the TEST page | **LOCAL** | Our own scrape-and-diff of our own page ("poll"); not a Context.dev monitor |
| Incident classifier | **SEED** | Deterministic rule-based stand-in, not an LLM; the quote check runs in code either way |
| Matching, alerts, latency | real code on the above | Latency chips are measured; `t_source` is the page's own timestamp |
| C1 to C5, verdict, ranking, approve + audit | real code on seed footprints | 25 unit tests; unknown never passes; approval re-verified server-side |
| Live news re-check | not run | Interface exists, answers UNKNOWN "not run" without a key |
| Candidate pool | **SEED** | 4 fictional candidates built to give VERIFIED, UNVERIFIED and two FAILED outcomes |
| Context.dev, Exa, Cala, Gemini | **UNVERIFIED** | Live code written from the docs, enabled by one env var each (`CONTEXT_DEV_API_KEY`, `EXA_API_KEY`, `CALA_API_KEY`, `GEMINI_API_KEY`), never run against the real services |

Nothing seeded, recorded or local is shown as live; the UI badges every result (LIVE / REC / SEED / LOCAL, SEEDED, TEST, poll). Tests: 25 checks tests and 63 API tests pass against a throwaway database.

## What we learned about the real APIs (documentation only, none verified live; see `docs/api-findings.md`)

- **Context.dev:** monitors have a 10-minute minimum interval and a baseline run, so a stage demo must use a scrape-and-diff poll with the webhook as a second path; webhooks are signed (`t=,v1=` HMAC-SHA256 over `"t.rawbody"`, 5 min tolerance) and need a public URL. Scrape defaults to a 3-day cache (`maxAgeMs: 0` for fresh). There is no single enrich endpoint; company search is free text. News search exists. Free-tier limits are 10 requests per minute.
- **Gemini:** the docs show two conflicting structured-output request shapes and the model list changed; the quote must be verified in code because the schema enforces shape, not truth.
- **Exa:** plain `/search` with category company is enough; Websets are paid and asynchronous, so skipped.
- **Cala:** fuzzy name search works on paper; ownership edges must be discovered with introspection, and coverage of small Nordic firms is unknown.

## Biggest risks found

1. Every real-API behaviour is still an assumption; the first keyed run will force fixes (field names, shapes, quotas).
2. Sparse public data: many footprint keys would be UNKNOWN on real suppliers, leaving alternatives UNVERIFIED. The design fails closed, which is honest but less impressive.
3. The live stage moment depends on a poll or webhook plus a tunnel; the monitor floor is 10 minutes.
4. Seed or local results can be mistaken for live ones; the badges are the mitigation and the demo script says it out loud.
5. Single-client MVP: `client_id` is on every private table, but there is no row-level security and no second login yet.

## Rough effort to reach the full demo in the design report

Estimates are rough and assume one engineer unless noted; the design report's own plan was 4 people for about 40 hours. The MVP already covers the core path of that plan (paste, resolve, footprints, poll, classify with quote check, incident, alternatives with five checks, approve). Remaining:

| Work | Estimate |
|---|---|
| Keys, first live call per vendor, fix live providers, record REC fixtures | 2 to 3 days |
| Context.dev monitors with webhooks per supplier and per shared port/region key (fan-out), tunnel or Aiven Runtime, signature test against a real secret | 1 to 2 days |
| Corroboration (official source or two independent domains in 48 h), strict news attribution rule | 1 to 2 days |
| Live news re-check on each candidate (real parsing, 14-day window) | 0.5 to 1 day |
| Exa candidate discovery of new companies (onboard them, footprint them) and Cala 2-hop ownership | 1.5 to 2 days |
| Real Gemini footprint extraction from supplier pages (plants, ports) | 1 to 2 days |
| Accuracy funnel and labelled set of about 40 items, latency p50/p95 | 1 to 2 days |
| Second client with Postgres row-level security and a login | 1 to 1.5 days |
| 40-supplier seeded client, UI polish, backup video, three rehearsals | 1.5 to 2 days |
| Aiven Postgres and Runtime deploy | 0.5 to 1 day |

Roughly **10 to 16 engineer-days**, or about **3 to 5 working days with four people** if work parallelises as before. Downstream monitoring (about 4 h) and the Valio order (about 8 h, optional) are out of scope here and would be on top. Access to keys and what the real APIs actually return are the largest uncertainty.
