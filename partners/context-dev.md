# Context.dev — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Identity and role

**Confirmed:** Junction lists Context.dev as a Challenge Partner and links to context.dev. The product is a web-data API; it should not be confused with similarly named libraries or documentation tools. Its site lists scraping, search, domain mapping, batches, answers and monitoring. [Junction](https://2026.hackjunction.com/#partners) · [Product](https://www.context.dev/)

The documentation describes returning Markdown, structured JSON and screenshots, with managed browser rendering and proxies. It provides API references, SDK routes and an API-key quickstart. These are documented capabilities, not proof of reliability on our target websites. [Documentation](https://docs.context.dev/introduction)

**Assessment:** prepare a bounded evidence-acquisition pipeline. The competitive opportunity is turning changing web information into a useful, reviewable action, not merely summarizing pages.

## Project hypotheses

| Candidate | Minimum demo | What distinguishes it |
|---|---|---|
| Supplier-change monitor | A changed public notice produces a sourced review item | Relevance filtering and before/after evidence |
| Public-service information check | Compare a small set of official pages for inconsistencies | Explicit sources and unresolved conflicts |
| Research evidence workspace | Extract comparable fields from a curated URL set | Missing values, provenance and freshness visible |

Do not assume these are the sponsor's actual challenge. Ask whether judging rewards a particular endpoint, data volume, accuracy or novel workflow. Large-scale scraping is unnecessary for a compelling weekend result.

## Build and data design

Use a server-side adapter with a strict URL allowlist for the initial demo, request/time limits, retries and caching. Store requested URL, final URL, retrieval time, source text and extraction result separately. A successful HTTP response can still contain a consent screen, empty content or irrelevant boilerplate.

Validate structured output against a small schema. Missing fields should remain unknown; they must not be completed from a model's memory. Give each field a source passage when possible. Keep scraped content as untrusted input: it cannot change application instructions, access secrets or authorize external actions.

For monitoring, retain snapshots and compare meaningful fields rather than all page text. Dynamic timestamps and navigation changes can otherwise create false alerts. Show what changed and why the application considers it relevant. A reviewer should accept, reject or dismiss the proposed action.

## Comparison and partner combinations

Exa is already covered in this repository; compare discovery quality and retrieved evidence on the same questions. Oxylabs is another web-data option; Cala is relevant when structured entities fit the task. These products overlap, so select one primary acquisition path unless a second demonstrably fills a gap.

Aiven or MariaDB can store snapshots and review status. IronShard can hold permitted larger artifacts if needed. None of those choices solves content quality or permission to reuse a page. Use public or otherwise permitted material and keep source attribution.

## Evaluation and execution

Create a small labelled URL set including normal pages, dynamic content, an unavailable page and a page that does not contain the requested fact. Track field accuracy, unsupported extraction, failed retrievals, latency and cost per accepted result. Benchmark our pipeline, not the vendor's headline success claim.

One developer owns ingestion/caching, one extraction/validation and one the review interface. Markus chooses sources, annotates expected answers and frames the decision. The first milestone is one URL through to inspectable evidence; the next is handling a failure honestly.

## Preparation and access gate

Read the quickstart, inspect response schemas and practise one permitted page once account access is available. No authenticated request was performed in this research. Ask about Junction credits, quota reset, supported domains, monitor delivery, retention, endpoint availability and how source content may appear in a public submission.

**Go:** an accessible source set and an observable user decision. **No-go:** the project depends on inaccessible or unlicensed data. **Pitch:** show the source change, extracted fact, evidence and accepted decision, with an explicit unknown case.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

