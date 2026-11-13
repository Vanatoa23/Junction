# Brief v2: Live supply-chain risk monitoring (Junction 2026, pivot)

## Your task
Design the best possible product and build plan for the concept below. A team of about 4 full-stack engineers builds it during Junction 2026 in Helsinki (13–15 November 2026; code freeze and demo on Sunday 15th). Assume roughly 40 hours of build time remain. Optimise for a working, impressive live demo that wins the **Context.dev** challenge. Be specific and opinionated, and label every assumption.

## The pivot (decided by the team)
1. **Primary target: Context.dev, "The Web Is Your Real-Time Database"** (€2k / €500, plus a €750 / €250 bounty for having Context.dev in the core flow). Judging, 20% each:
   - real-world impact
   - creative use of live web data
   - demo completeness
   - technical execution (latency and accuracy)
   - real-timeness (reacting to change over time, not a one-off snapshot)
2. **Main offer: live monitoring of a client's supply chain and its risks.**
   - The client already knows its supply chain, either fully or just the first tier, and enters it (for example by pasting or uploading a supplier list).
   - We monitor every company in it continuously with live web data.
3. **Incident → alternative.** When an incident happens that affects the client's supply, an agent offers an alternative supplier, if one exists. **Hard rule:** the same incident must not affect the alternative. For example, it must not be in the same strike region, share the same upstream plant, depend on the same port, or be hit by the same sanction.
4. **Upstream and downstream monitoring (optional, team is keen).**
   - Monitor upstream: the suppliers of suppliers.
   - Monitor downstream: the client's own customers, because stable customers might run into trouble buying from or paying the client (demand-side and credit risk).
5. **Data bootstrap.** The team wants to use **Exa** (search, Websets, structured company lists, Monitors) and **Cala** (a structured, sourced knowledge graph of companies, people, funding rounds and investors, queryable via API or MCP). They would give us the first nodes and companies on the graph, and Context.dev would then enrich and monitor them.

## Tools available
**Context.dev** turns web pages, companies, people and news into clean structured data. Features:
- scraping and crawling, structured JSON extraction
- company and people enrichment
- news search
- **monitors with webhooks for change detection**
- batch processing
- PDF parsing
- SDKs for JS, Python, Ruby and Go, plus an MCP server

Do not invent features beyond this list; label anything else as an assumption.

**Other tools:**
- **Exa:** search (fast, balanced and deep modes), Contents API, filters by date, domain and category (company, news, people), structured output, Websets, Monitors, MCP.
- **Cala:** company, people, funding and investor knowledge graph via API or MCP. Cala's own challenge is about founders and investors, so it is a *data source* here unless you make a credible case otherwise.
- **Gemini API** (€4k bounty): the main LLM.
- **Aiven** (€1k bounty): managed Postgres, Valkey, Kafka, ClickHouse and OpenSearch, plus app hosting (Runtime).
- **CRACI:** CI with SBOMs, near-zero effort.
- **OpenAI Codex:** a bounty if used meaningfully in development.
- **Valio Aimo's "Trusted Trade Agents" challenge** still exists: a synthetic catalogue, mock ordering APIs and human approval. It is now *secondary*: worth stacking only if it does not hurt the Context.dev story, for example by placing the switch order through Valio's mock API after approval.
- **ArcadeDB** (graph database, not a sponsor) or plain Postgres.

## Constraints
- Live demo end to end, which must survive judges trying it. A backup video is allowed.
- Real web data must show its source URLs. Synthetic or seeded data must be labelled.
- Privacy: a client's supply map is private to that client.
- Simple, proven tooling only.

## What to return
1. Product summary and a name.
2. Architecture and data flow, including the database choice.
3. Data model: companies, edges, incidents, the incident "footprint", alerts, alternatives.
4. Onboarding and bootstrap: how the client's list becomes a monitored graph (Exa, Cala, Context.dev), and how long it takes.
5. Monitoring design: what is watched per company (pages, news queries, filings), how monitors and webhooks are set up, how noise is filtered, and how latency is measured.
6. The incident model and the "not affected by the same incident" check for alternatives.
7. The alternative-finding agent: sources, ranking, validation, and human approval.
8. Upstream and downstream monitoring: in or out, and how.
9. Screens and a 3–4 minute demo script that hits all five Context.dev criteria.
10. Build plan for ~40 hours with 4 engineers, the top risks, and what to cut first.
