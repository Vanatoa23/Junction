# MariaDB — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Identity and role

**Confirmed:** MariaDB is listed as a Challenge Partner. Its public offering includes a relational database, managed cloud services and AI-oriented capabilities. No 2026 track requirements or participant allocation were found in the reviewed official event material. [Junction](https://2026.hackjunction.com/#partners) · [MariaDB](https://mariadb.com/)

**Assessment:** prepare one small relational-plus-vector example. The useful differentiator is a decision that combines semantic similarity with exact business constraints. Installing a database behind an ordinary chatbot is unlikely to make a compelling partner story unless the brief specifically asks for that.

## Developer capability that matters

The official vector reference documents the `VECTOR(n)` type, vector indexes, conversion functions and distance queries. Vector support is available from Community Server 11.7 and Enterprise Server 11.4.5-3. Verify the actual server version; do not assume an older MySQL-compatible service supports these features. Vectors are produced by an external embedding model and then stored/searched in MariaDB. [Vector reference](https://mariadb.com/docs/server/reference/sql-structure/vectors/vector-overview)

This creates a practical architecture: relational records contain authoritative IDs, dates, owners and statuses; embeddings support similarity over associated text. Keep the embedding model/version and dimensions with the ingestion configuration. A database with vector search is not itself an embedding model or an answer-generation system.

## Project hypotheses

| Direction | Why MariaDB matters | What to demonstrate |
|---|---|---|
| Constrained product substitution | Similarity plus exact stock, price and eligibility filters | A similar-looking but unavailable item is rejected |
| Construction evidence search | Text retrieval joined to document version, site and access rights | An obsolete revision cannot answer a current query |
| Research evidence workspace | Semantic retrieval joined to provenance and reviewer status | Every generated claim opens its source and review state |

These are our proposals, not published MariaDB challenges. The first pairs naturally with Valio Aimo; the second with Stoa; the third with a research-oriented brief. Cross-partner eligibility still needs confirmation.

## Minimum viable architecture

A web client calls a backend with constrained, parameterized query functions. The backend filters authorized records and performs retrieval, then sends only selected evidence to an answer model. The user sees source records and uncertainty. Avoid unrestricted model-generated SQL against the writable application database. For a natural-language analytics demo, use a read-only role, permitted views, row limits and a query timeout.

Seed roughly a few hundred representative rows for development. This is a suggested practice scale, not a product limit. Include near-duplicates, missing fields and disallowed records. Keep an exact-search baseline and compare the same queries with vector retrieval. Measure whether the correct result appears in the top candidates, whether constraints are respected and how long the end-to-end answer takes.

## Trade-offs and failure modes

Use MariaDB when the challenge rewards it or the combined SQL/vector story is central. Use the team's familiar database if switching adds work without improving the demonstration. Do not deploy two relational stores merely to collect sponsor logos.

Important risks are dimension mismatches, embedding drift, unsupported index syntax, data leakage through retrieval, and a benchmark that compares different filtering conditions. Similarity is not factual correctness. Distinguish nearest neighbours from verified substitutes or approved evidence. Keep calculations in application code or SQL and let the model explain results.

## Preparation and weekend plan

Before the event, read the vector guide, check the chosen server release, and practise create → insert → query → reset with non-challenge data. Capture the installation version and commands in a learning note. No full submission should be built ahead of the competition.

At the event, one developer owns the schema and queries, another the API and model interface, and the third the user flow. Markus defines the relevance judgements and business constraints. Produce a visible baseline comparison before adding further agents or dashboards.

Ask the mentor which MariaDB edition and deployment are intended, whether cloud access is provided, which features are mandatory, whether external embeddings are permitted and what technical evidence judges expect. **Go** when the main user decision benefits from database capabilities; **no-go** when the team cannot run the required version quickly.

**Pitch:** demonstrate a case where semantic retrieval alone fails, then show exact constraints resolving it. Report results on a fixed query set, including failures. Never imply that the sponsor has validated the application.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

