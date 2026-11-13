# Brief: Living Supply-Chain Network (Junction 2026 hackathon project)

## Your task
You are designing the best possible solution for the product described below. A full-stack team of engineers must build it and demo it end to end within a 48-hour hackathon (Junction 2026, Helsinki, 13–15 November 2026; the code freeze and demo are on Sunday the 15th).
Propose a concrete solution: architecture, data model, agent design, demo flow and a build plan. Optimise for a working, impressive live demo that scores well against the sponsor judging criteria listed below, not for a complete production system. Be specific and opinionated. Where you make assumptions, state them.

## 1. The product
Companies know who they buy from directly, but have little visibility past that first step. They don't know who their suppliers depend on, which risks are building up in their chain, or whether a cheaper or more compliant supplier exists.
The product is a living supply-chain network: a graph of companies (nodes) and buying/selling relationships (directed edges) that grows over time.

### Core mechanics
- Onboarding. A company registers and declares who it buys from (incoming edges) and who it sells to (outgoing edges).
- Network growth. If a declared company is not yet in the network, it is added automatically as an unregistered node and invited to join. Once it joins, it declares its own suppliers and customers, and the graph keeps expanding.
- Trust levels on every edge. The trust level rises as more parties confirm the edge:
  - `inferred`: discovered by AI from public data (web, news, partner datasets). Shown with a confidence score and source links.
  - `claimed`: one side has declared it (one-sided connection).
  - `agreed`: both sides have confirmed it.
  - `audited`: verified by a third-party auditor. Auditor details are not important for the prototype; a simulated auditor account is fine.
- AI agents keep the network alive:
  - A discovery agent scrapes the web and partner data to find new companies and likely connections, and adds them as `inferred`.
  - A monitoring agent re-checks existing companies on a schedule or via webhooks to see if they are still performing, and records risk signals.
  - A procurement agent suggests switching suppliers when a risk or price premium appears and, with human approval, places the order.

### Privacy and visibility rules (decided)
- A company's own map (its suppliers and customers) is private by default.
- A buyer does see:
  - Risk warnings about its suppliers and their upstream chain.
  - How commonly a supplier is used by other companies in the same industry, as anonymised aggregates only.
  - Alternative suppliers, but only those that have opted in to being visible.
  - Prices or price ranges, but only where the seller has chosen to publish them. Sources are public catalogues or prices the seller declares in the network.

### Risk types to detect
- Geopolitical (country or region risk, conflict, trade restrictions)
- Regulatory and compliance (sanctions lists; EU rules such as CSDDD and the EU Deforestation Regulation; expired or missing certifications)
- Concentration (single-source dependency, and hidden shared upstream suppliers, where several direct suppliers all rely on the same upstream company)
- Financial health (funding, layoffs, insolvency signals)
- Live events (recalls, strikes, outages, negative news)
- Price premium (the buyer pays above visible alternatives; optional, and only when prices are published)

### Value for each side
- Buyers: visibility, risk alerts, alternatives, easier compliance.
- Suppliers: discovery and visibility to new buyers.
- Everyone: easier sanctions and regulatory compliance across the network.

## 2. Demo scenario (preferred, open to improvement)
- Valio Aimo is at the centre of the demo network. It is a Finnish food-service wholesaler with about 20,000 professional customers, about 700 suppliers and about 25,000 products.
  - Incoming edges: Valio's suppliers, plus upstream suppliers discovered by agents.
  - Outgoing edges: Valio's customers.
- The persona we log in as is a hotel chain (a grocery store is an alternative) that buys through Valio.
- Target story: the hotel logs in → sees its supply map → gets a risk alert on an upstream dairy producer → sees visible alternatives with price ranges → the procurement agent proposes a switch → a manager approves → the order is placed through Valio's (mock) API → everything is logged.
- Also show:
  - A supplier confirming an edge, so it goes from `claimed` to `agreed`.
  - An auditor stamping an edge as `audited`.
  - At least one live agent run that pulls real web data into the graph during the demo.
- Data strategy:
  - Seed from Valio's synthetic data.
  - Add hand-crafted dummy companies so the demo story is guaranteed to work.
  - Add some real scraped companies and connections so the "live" parts are genuinely live.

## 3. Available resources

### Graph database: ArcadeDB (strong candidate)
ArcadeDB (https://arcadedb.com/supply-chain.html) is open source (Apache 2.0) and multi-model. It offers:
- One engine for several data types: graph, documents, time-series, vector search (HNSW / DiskANN) and full-text search.
- Three query languages over the same graph: Cypher, SQL and Gremlin.
- Ready-made supply-chain features: multi-tier upstream traversal; "blast radius" analysis of a supplier failure; batch traceability and recall simulation; vector similarity search to find alternative suppliers; JSON documents on nodes for certifications and audit trails; time-series data for delivery and lead-time metrics.
- Deployment and examples: Docker and Helm deployment, plus demo code for supply chains in its use-cases GitHub repository.

Evaluate whether to use it as the primary store versus plain Postgres. ArcadeDB is not a hackathon sponsor.

### Hackathon partners: main challenges (the project can enter several)

**Valio Aimo, "Trusted Trade Agents"** (primary target; €4k / €2k / €1k)
- They provide a synthetic product catalogue, simulated suppliers, and mock APIs for their webshop and backend. The data includes prices, availability, delivery lead times and sustainability certificates.
- Core requirements: product, price and availability lookup for an external agent; request → order flow at fixed prices; permission and human-approval management.
- Optional extras: delivery and sustainability comparison, substitutions and exceptions, and a traceable log that explains what the agent did and why.
- Judging: working end-to-end demo 30%; precisely solving the buyer's need 20%; autonomy and controls (guardrails, auditability) 20%; robustness to exceptions (partial availability, substitutions, delivery constraints) 15%; open standards and a credible path to production 15%.
- Preferred tech: agentic and tool-use frameworks, open data and interoperability standards, recommendation logic, and optionally verifiable credentials or a trust layer.

**Context.dev, "The Web Is Your Real-Time Database"** (€2k / €500)
- Their web data API returns clean structured data about pages, companies, people and news. It covers scraping, crawling, structured JSON extraction, company and people enrichment, news search, monitors with webhooks for change detection, batch processing and PDF parsing. SDKs for JS, Python, Ruby and Go, and an MCP server.
- Judging: equal 20% each for real-world impact; creative use of live web data; demo completeness; technical execution (latency and accuracy); real-timeness (reacting to change over time, not a one-off snapshot).

**Cala, "Make Unicorns Real"** (secondary; only if there is a founder or investor angle)
- Cala is a structured, sourced knowledge graph of companies, people, funding rounds and investors, queryable via API or MCP.
- The product must solve a need for founders or investors. Possible angle: an investor checking a startup's supplier concentration and supply-chain risk before investing.
- Judging: equal 25% each for real need; execution; originality; Cala being core to the product, not an add-on.

**Exa** is used as a data source only (its main challenge is about personal-life tasks, a poor fit). Search API (fast, balanced, deep), Contents API (full text, summaries, crawling), filters by date, domain and category (companies, news, people), structured JSON output, past versions of pages, Websets (verified lists of companies), Monitors (recurring searches), MCP server and SDKs.

### Hackathon tech partners (side bounties, stackable)
- Context.dev (bounty): must be in the core flow. €750 / €250.
- Google Gemini API (bounty €4k): good choice as the main LLM for the agents.
- OpenAI Codex: credits available; bounty if Codex is meaningfully used in development.
- Aiven (bounty €1k): managed Postgres, Valkey, Kafka, ClickHouse and OpenSearch, plus app hosting (Runtime). Does not host ArcadeDB; could host app or user data, a cache, or event streams.
- CRACI: GitHub Actions-compatible CI runners that produce SBOMs and fix vulnerabilities. Near-zero effort to enter, thematically aligned (software supply chain).
- Modal / Verda: GPU and CPU compute, useful for batch discovery jobs or self-hosted models.
- Oxylabs Web API (optional): live search and scraping with geo-targeting; trial requires a paid plan with a discount code.

## 4. Constraints
- 48-hour build by a small full-stack team (assume about 4 engineers), all in the same location.
- The demo must work end to end, live, and survive judges trying it. A pre-recorded backup video is allowed.
- The Valio data is synthetic and accessed through mock APIs. Real web data must be clearly sourced (show URLs).
- Use simple, proven tooling. Avoid anything that needs days of setup.

## 5. What we want back
1. One-paragraph product summary and a short name suggestion.
2. Architecture: components, data flow, and database choice (ArcadeDB vs Postgres vs hybrid), with reasoning.
3. Data model: node and edge types and key properties; how trust levels and visibility are stored and enforced; example queries for upstream traversal, hidden concentration, blast radius, alternatives.
4. Agent design for each of the three agents: inputs, tools/APIs, outputs, validation (confidence and sources), human approval.
5. Risk engine: how each risk type is detected and scored, and which data source feeds it.
6. UI and screens: minimal set of screens, and what the graph view shows (direction, trust level, risk).
7. Demo script: 3–5 minute walk-through hitting the judging criteria of Valio, Context.dev and (optionally) Cala.
8. 48-hour build plan: task split across 4 engineers, milestones (Friday night / Saturday / Saturday night / Sunday morning).
9. Mapping to judging criteria: per challenge and bounty, what in the demo earns the points.
10. Top risks and cuts: what to cut first, and the biggest technical risks.
