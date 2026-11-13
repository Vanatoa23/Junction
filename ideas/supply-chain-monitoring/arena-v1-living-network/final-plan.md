# Upstream: the winning build plan (Junction 2026)

This plan comes from a 64-entrant arena (see `bracket.md`). The core is champion **#60 "Hold Week"**, with the runner-up **#17 "Upstream"** product rule and the best ideas from 18 other entrants merged in. Nothing here has been built yet. Every assumption about the sponsor APIs is marked **(A)**; check each one in hour 1.

---

## 1. Summary and name
**Upstream** shows a buyer the suppliers behind its suppliers.
- It builds a living graph of companies and supply edges. Every edge carries a trust level (`inferred`, `claimed`, `agreed`, `audited`) and its evidence.
- Live web monitors turn real-world changes into sourced risk warnings.
- When a risk lands, a procurement agent drafts a switch to an opted-in alternative. That alternative must not share the failing upstream source.
- The agent checks the switch against the buyer's mandate, handles partial stock and substitutions, and places the order through Valio's API only after a manager approves the exact quote.

**Pitch:** "Three suppliers. Three brands. One upstream dairy. We saw it, proved it, and switched, with a human signing."

## 2. Architecture and database choice
**Decision: Postgres on Aiven is the only store. ArcadeDB is not used.**
- **Field consensus:** none of the 6 ArcadeDB-first entrants reached the quarterfinals.
- **Scale:** the demo graph is a few hundred to a few thousand nodes and at most 4 hops, so recursive CTEs answer in milliseconds.
- **Privacy:** Postgres row-level security enforces the privacy rules inside the database.
- **Bounty:** Aiven Postgres earns the Aiven bounty.
- **Fallback:** ArcadeDB remains a post-hackathon option for traversal at scale. Use pgvector only if Aiven has it enabled **(A)**; otherwise match alternatives by category.

**Stack:** one TypeScript monorepo, one language for four engineers.
- `api`: Fastify, Zod schemas, server-sent events (SSE) for live updates.
- `worker`: agent jobs taken from a `job` table with `FOR UPDATE SKIP LOCKED`.
- `web`: React, Vite, Cytoscape.js.
- **No Kafka.** Postgres `LISTEN/NOTIFY` pushes updates to SSE; Aiven Valkey pub/sub is optional.
- **Hosting:** Aiven Runtime, so judges get a stable public URL and Context.dev webhooks reach us without a tunnel **(A)**. Fallback: a laptop plus a tunnel.

**Two components every entrant converged on:**
- **`source()` adapter (#45, #14).** Every call to Context.dev, Exa, Gemini or Valio goes through one function with:
  - a timeout, retry and circuit breaker;
  - a mode on every result: `LIVE`, `REC` (the last real response, keyed by request hash) or `SEED`;
  - a badge in the UI showing that mode. Nothing pretends to be live.
- **Gemini tool loops with no framework (#31).** Each agent is about 60 lines: a tool list, a step cap and a typed output. The LLM can only *propose*. Scores, trust changes and orders are done by code.

**Data flow:**
1. A Context.dev monitor webhook or a "Scan now" click creates a `source_item`.
2. Gemini extracts claims; code checks each quote against the page; corroboration is applied.
3. A `risk_signal` is written.
4. The risk engine updates `risk` and its factors.
5. An inbox item is pushed to the browser over SSE.
6. The procurement agent writes a `proposal`.
7. The manager approves, and the approval binds to `quote_hash`.
8. The order service calls Valio `POST /orders` with an idempotency key.
9. An `event_log` row records it in the hash chain.

## 3. Data model
```
company(id, name, business_id, domain, country, industry, status[unregistered|registered], opted_in_alt bool, origin[valio_synth|story|scraped|live])
edge(id, src_id, dst_id, category, trust[inferred|claimed|agreed|audited], confidence, visibility[private|risk_only|public])
edge_event(edge_id, event[agent_suggest|buyer_claim|supplier_confirm|auditor_stamp], actor, at)   -- trust changes only through this table (#31)
evidence(id, edge_id|company_id, url, quote, retrieved_at, sha256, mode)
source_item(id, url, domain, provider, fetched_at, content_hash, text)
risk_signal(id, company_id, type, severity, corroboration, status[unconfirmed|corroborated|expired], evidence_ids[])
risk(id, company_id, score, path jsonb) + score_factor(risk_id, factor, weight, value, conf, contribution)
price_publication(company_id, sku, min, max, published bool)
mandate(buyer_id, categories, max_order_eur, allowed_origins, max_risk, max_premium_pct)
proposal(id, buyer_id, lines jsonb, rejected_options jsonb, quote_id, quote_hash, quote_expires_at, version, status)
exception(id, proposal_id, type, detail, status)
approval(proposal_id, version, quote_hash, approver, at)
event_log(seq, actor, verb, why, evidence_ids, payload, prev_hash, hash)   -- append-only; UPDATE and DELETE revoked
```
**Trust:**
- Code sets the trust level from `edge_event`: buyer claim → `claimed`; both sides confirm → `agreed`; auditor stamp → `audited`. An invalid transition returns HTTP 409.
- Agents can only write `inferred`.
- Confidence for an inferred edge: 0.4 / 0.7 / 0.85 for 1 / 2 / 3+ independent domains.
- A quote is accepted only if it is a verbatim substring of the fetched page.

**Visibility:**
- Row-level security keyed on `app.viewer`, plus one `visible(viewer)` function that every endpoint calls.
- A buyer sees: its own edges; risk warnings on its upstream nodes (name, evidence and tier count, never the intermediate chain); industry usage only when at least 5 companies are counted; alternatives only where `opted_in_alt` is set; prices only where `published` is set.
- A "Why can't I see this?" link shows which rule hid a node (#22).
- A CI test suite proves that "buyer cannot see a supplier's private edges".

**Key queries:**
```sql
-- Upstream traversal (cycle-safe, depth 4)
WITH RECURSIVE up(root, node, depth, path) AS (
  SELECT e.src_id, e.src_id, 1, ARRAY[e.dst_id, e.src_id] FROM edge e WHERE e.dst_id = $buyer
  UNION ALL
  SELECT up.root, e.src_id, up.depth+1, up.path || e.src_id
  FROM up JOIN edge e ON e.dst_id = up.node
  WHERE up.depth < 4 AND NOT e.src_id = ANY(up.path))
SELECT node, min(depth) FROM up GROUP BY node;

-- Hidden concentration: an upstream hub reached through 2 or more distinct direct suppliers
SELECT node AS hub, count(DISTINCT root) AS n_direct FROM up
WHERE depth >= 2 GROUP BY node HAVING count(DISTINCT root) >= 2;

-- Blast radius: the same recursion run downstream from a failed node, joined to the buyer's order lines (SKUs, EUR/week)
-- Optional trust floor: follow only edges at or above a chosen trust level (#41)

-- Alternatives: opted-in, published price, same category,
-- AND upstream-disjoint (no path to the failing hub), the runner-up's rule (#17)
SELECT c.* FROM company c JOIN price_publication p ON p.company_id = c.id AND p.published
WHERE c.opted_in_alt AND c.industry = $cat
  AND NOT EXISTS (SELECT 1 FROM up_closure(c.id) u WHERE u.node = $hub);
```

## 4. Agents
**Discovery:**
- *Input:* a supplier name or domain.
- *Tools:* `ctx.enrich(domain)`, `ctx.news(query, since)`, `ctx.extract(url, schema)`, `propose_edge`.
- *Output:* an `inferred` edge with its evidence.
- *Validation (in code):* every URL must be one a tool actually returned; the quote must appear verbatim on the page; one domain caps confidence at 0.6; no source means no edge.
- A company that isn't in the network yet becomes an `unregistered` node with an invite event.
- *Human step:* the buyer clicks "Accept", which makes the edge `claimed`.

**Monitoring:**
- *Inputs:* Context.dev monitors on supplier domains, two Finnish food-safety news pages (Ruokavirasto recalls **(A)**) and one demo page we host. A 60-second polling fallback runs alongside.
- *Gemini output:* `{event_type, severity_hint, quote, effective_date}` or `null`.
- *Corroboration (#27):* one domain gives `unconfirmed`, which stays out of the buyer's view; two domains give `corroborated`.
- Dropped events stay visible in a change log, so judges can see the noise being rejected.

**Procurement:**
- *Trigger:* a corroborated risk with score ≥ 60, or a price premium above the mandate.
- *Read-only tools:* `valio.search`, `valio.availability`, `valio.quote` **(A: a fixed-price quote with a time limit)**, `graph.alternatives`, `graph.hub_check`, `mandate.check`, `propose`. It has **no order tool**; placing the order is an API action that needs an approval matching `quote_hash` and `version`.
- *Exception catalogue (#14):*
  - **Partial stock:** split across the next upstream-disjoint alternative.
  - **Substitute:** its certificates must be a superset of the original's, or it is blocked.
  - **Delivery window missed:** the line is excluded, with the reason shown.
  - **Price moved:** re-quote, and the approval is reset.
  - **Order call times out:** look up the order by idempotency key and never order twice.
  - **Nothing viable:** escalate to the manager with three options.

**Approval:**
- A manager approves in the UI or on a phone link.
- The approval binds to the exact quote hash and expires after 15 minutes.
- Above €2,000, a second approver is needed (cut first if time runs short).

## 5. Risk engine
Deterministic and explainable. Gemini only classifies text.

**Formula:** score = min(100, Σ weight × value × confidence × decay), with:
- decay: half-life of 14 days for news, 60 days for recalls, 90 days for regulatory signals;
- propagation: 0.8 per upstream hop;
- trust factor: inferred 0.6, claimed 0.8, agreed or audited 1.0.

Every factor is stored, so clicking a score shows the arithmetic (#35, #60).

| Type | Detection | Feed |
|---|---|---|
| Geopolitical | country table (labelled seeded) plus conflict and trade-restriction news | static index plus Context.dev news |
| Regulatory | sanctions name match (OpenSanctions or EU list snapshot **(A)**); certificate expiry; EUDR commodity rule; missing CSDDD policy page | snapshot plus Valio certificate fields plus `ctx.extract` |
| Concentration | hub query; single source per SKU | graph |
| Financial | insolvency, layoff and funding keywords; enrichment deltas | Context.dev enrich and news |
| Live events | recall, strike, outage; recalls get a severity floor | Context.dev monitors and webhooks |
| Price premium | (paid − cheapest published opted-in alternative) / alternative > 8% | published prices only |
| *Delivery dip (stretch, #51)* | fill-rate z-score < −3 on the buyer's own Valio order outcomes | Valio mock order history **(A)** |

## 6. Screens
1. **Inbox (home, #39):** "3 need a decision today", covering risks, proposals, confirmations and discoveries, ranked by severity × exposure × urgency.
2. **Supply map:**
   - Upstream on the left, buyer on the right, arrows show the supply flow.
   - Edges by trust: dotted for `inferred` (with a confidence label), solid for `claimed`, thick for `agreed`, double with a shield for `audited`.
   - Nodes: ring colour shows risk; a hollow node is unregistered; a hub pulses with a "3 paths" badge; an origin chip and a LIVE/REC/SEED badge sit on each node.
3. **Risk detail:** evidence quotes and URLs with fetch times, corroboration count, score factors, blast radius in SKUs and €/week, and a "why you see this" rule.
4. **Alternatives:** opted-in suppliers only, each with a price band, certificate status, lead time, an "independent of hub ✓" check and a "used by 9 of 14 hotels (n ≥ 5)" line. Hidden suppliers appear as "not visible: not opted in".
5. **Proposal review:** old and new lines, rejected options with reasons, the mandate checks table, a quote countdown, and Approve.
6. **Trail:** a hash-chained timeline of evidence, tool calls, approvals and orders, with a **Verify chain** button.
7. **Supplier portal:** confirm an edge, publish prices, opt in as an alternative.
8. **Auditor page:** stamp an edge as audited.
9. **Ops panel:** source status, a "Type any company" live lookup, a demo **Inject** panel (stock to 40%, order timeout, price +5%, Context.dev offline) and Reset.

## 7. Demo script: "Hold Week" (about 4 minutes)
**Seed graph:**
- Hotel buyer: Lumi Hotels (fictional).
- Its two direct dairy suppliers through Valio: Pohjola Maito (`claimed`) and Kallio Juusto (`agreed`).
- Both depend on **Nordic Dairy Co-op (NDC)**, the hidden hub.
- Alternatives:
  - Lakeside Dairy: opted in, `inferred` at 0.7 from two URLs, published €3.20–3.36.
  - Kettu Dairy: opted in, certificate expired.
  - Baltic Butter: not opted in, so hidden from the buyer.
- Pohjola's emergency price is €3.49.

| Time | Beat | Criterion it serves |
|---|---|---|
| 0:00 | Hook: "Three suppliers, three brands, one dairy." Lumi logs in; the inbox shows 3 items. | story |
| 0:20 | **Live discovery:** "Scan now" on three real Finnish dairy domains. URLs stream in; the Lakeside edge appears `inferred` 0.7 with quotes. A judge clicks a URL. | Context.dev live, trust |
| 0:55 | **Live monitor:** the presenter edits the NDC "production hold" notice on our demo page (labelled DEMO). The webhook fires, the alert lands, "detected in 9 s" shows, and NDC's ring turns red. | real-timeness |
| 1:25 | **The reveal:** the concentration banner. Pohjola and Kallio both rely on NDC. Score breakdown 62 + 48; blast radius 14 SKUs, €2.1k/week. | buyer need, explainability |
| 1:50 | **Privacy:** the alternatives table. Kettu is rejected (expired certificate), Baltic is "not visible: not opted in", and the industry aggregate reads n=9 of 14. | privacy model |
| 2:15 | **Agent:** the proposal streams its tool calls. Valio quote, upstream-disjoint ✓, premium within mandate ✓, rejected options shown. | autonomy and controls |
| 2:40 | **Exception:** a judge presses "Stock to 40%". Lakeside can fill only 90 of 120, so 30 go to a Valio own-brand substitute (certificate superset ✓) and the approval resets. | robustness |
| 3:05 | Manager approves on a phone. Valio order ID returned, with the idempotency key shown. | end-to-end |
| 3:25 | Supplier tab: Lakeside confirms, `claimed` → `agreed`. Auditor stamps `audited`; the edge redraws live. | trust levels |
| 3:45 | Trail → **Verify chain** ✓. Close on what's live, what's seeded, and the production path (MCP endpoint, Aiven, SBOM). | auditability, open standards |

**Backup:** a recorded video of the same run, made by Sunday 08:00.

## 8. 48-hour build plan
- **E1:** data, row-level security, queries, event log.
- **E2:** Context.dev, Gemini, discovery and monitoring.
- **E3:** Valio, procurement, exceptions, approvals.
- **E4:** frontend, seed data, demo operations.

| Milestone | Work | Exit check |
|---|---|---|
| **H0–H1, Fri 18–19** | Freeze the API contracts (Zod types) and fixtures; repo; Aiven Postgres and Runtime. **Check every (A) item:** Valio mock endpoints (quote, partial fill), Context.dev monitor and webhook payload, pgvector. | the contract is committed |
| **M1, Fri night** | E1 schema, seed (Valio synthetic data plus the Hold Week story), visibility function and 10 privacy tests. E2 `source()` adapter, one real Context.dev extract captured as REC. E3 Valio client plus a local stub with partial fill. E4 Cytoscape map from seed, persona login. CRACI GitHub Action with SBOM (20 minutes). | the map renders from the API with no live calls |
| **M2, Sat** | E1 hub, blast-radius and alternatives queries; risk engine with score factors. E2 discovery loop with quote check and the live scan button. E3 procurement loop, mandate checks, proposal and approval bound to the quote hash. E4 inbox, risk detail, alternatives, proposal screens. | one live scan writes an inferred edge; one proposal can be approved |
| **M3, Sat night** (feature freeze 23:00) | E2 monitor webhook, demo page, corroboration, latency stamp. E3 exception catalogue, inject panel, order with idempotency key. E1 trust state machine, event-log hash chain, verify. E4 supplier and auditor pages, Trail, ops panel, LIVE/REC/SEED badges. | the full script runs once end to end |
| **M4, Sun morning** | Record REC fixtures for every beat; backup video by 08:00; three rehearsals (one with Wi-Fi off); fixes only; freeze 10:00. | three clean runs |

**Stretch, in priority order:**
1. A read-only MCP server exposing `search_products`, `check_availability` and `request_order`, with the approval gate on the server side (#08).
2. A trust-floor toggle on the blast radius.
3. A delivery-dip sparkline.
4. A UBL-shaped order payload.

Use Codex for seed generators, test fixtures and the Valio client, and log that use for the Codex bounty.

## 9. Mapping to judging criteria
- **Valio Aimo:**
  - *End-to-end (30%):* the full run from risk alert to approved order to Valio order ID is live.
  - *Buyer need (20%):* hidden concentration plus upstream-disjoint alternatives at a known price.
  - *Autonomy and controls (20%):* mandate checks, propose-only agent tools, approval bound to the quote hash, Verify chain.
  - *Exceptions (15%):* partial fill, certified substitute, delivery window, price change and order timeout, all triggerable by judges.
  - *Open standards (15%):* MCP endpoint, OpenAPI contracts, Business IDs and GS1-ready product IDs, and a production path through Aiven with an SBOM.
- **Context.dev:**
  - *Impact:* sourced risk warnings beyond the first tier.
  - *Creative live data:* discovery with verbatim quotes plus corroboration.
  - *Completeness:* the live web changes the graph, and that leads to an order.
  - *Technical execution:* latency shown on screen; noise dropped with reasons.
  - *Real-timeness:* the monitor webhook fires live on stage.
- **Gemini:** all three agents use Gemini function calling and structured output.
- **Aiven:** Postgres, Runtime and optionally Valkey.
- **CRACI:** SBOM in CI from Friday.
- **Codex:** logged development use.
- **Cala:** skipped on purpose. An investor persona split the story in every entrant that tried it.

## 10. Risks and cuts
**Cut in this order:**
1. Two-person approval.
2. Delivery-dip signal.
3. Trust-floor toggle.
4. MCP server.
5. Corroboration (keep single-source signals, labelled as such).
6. Auditor page (stamp from the ops panel instead).
7. Webhook (fall back to 60-second polling plus "Re-check now").

**Never cut:**
- the live Context.dev scan with URLs;
- the hub plus upstream-disjoint alternatives;
- the approval-gated Valio order;
- one exception;
- visibility enforcement;
- Verify chain.

**Biggest technical risks:**
1. **The Valio mock may not support quotes or partial fills.** Check in hour 1. If it doesn't, our adapter adds a quote layer over its fixed prices and simulates partial fills, clearly labelled.
2. **Context.dev monitor timing or payload is unknown.** Capture a real payload on Friday; the polling and REC fallbacks are ready.
3. **Live scans may return thin results on stage.** Pre-test the three domains; the REC badge stays honest.
4. **Judges may read the seeded story as rigged.** The origin chips make it clear what is seeded and what is live, and judges can trigger the live lookup and the inject panel themselves.
5. **Leaks through row-level security or the visibility function.** The privacy tests run in CI as each persona.
