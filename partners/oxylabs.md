# Oxylabs — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed product and role

Oxylabs is a Tech Partner. Its site and developer portal describe web-data access, including search/scraping APIs, proxies and browser tooling. The documentation distinguishes product-specific quickstarts. Use the exact current product reference instead of treating all endpoints and authentication as interchangeable. [Junction](https://2026.hackjunction.com/#partners) · [Product](https://oxylabs.io/) · [Developer portal](https://developers.oxylabs.io/)

**Assessment:** relevant when reliable acquisition of permitted public data is central to the application. For a small known URL set, a managed API can reduce plumbing. It is not evidence that target content may be reused or that extraction is correct. No Junction account allocation or live request was verified.

## Project hypotheses

| Direction | Bounded demo | Metric |
|---|---|---|
| Public-information freshness audit | Compare official pages with saved prior snapshots | Meaningful changes detected |
| Market evidence tracker | Extract a fixed schema from a small permitted source set | Correct fields and evidence coverage |
| Agent retrieval reliability bench | Compare acquisition paths on representative pages | Usable results, latency and cost |

These are independent ideas, not an announced challenge. Prefer a narrow source set and clear downstream decision. Broad crawling can consume quota and preparation time without improving the pitch.

## Integration pattern

Select one product and complete its documented quickstart. Keep credentials on the server. Use a job record with URL, requested fields, status, attempt count and timestamps. Store source text separately from parsed output. Bound concurrency, retries, total requests and maximum processing time.

Validate the returned page before extraction: the response may be a login screen, consent prompt, empty shell or unrelated redirect. Schema-valid JSON can still contain unsupported facts. Retain the exact supporting passage and retrieval time.

Web content is untrusted input. It must not authorize model tool calls, reveal secrets or instruct the application to change its policy. If the product proposes actions based on scraped facts, require a review step and show the evidence.

Use permitted public content and respect source conditions. Do not make the demo depend on bypassing authentication or acquiring private information. A proxy product does not itself grant access rights.

## Comparison with other partners

Context.dev and Exa are alternatives or complements for web acquisition; Cala can be relevant when normalized entities answer the question directly. Compare on the same target pages/questions and output criteria. Choose one primary path before building a provider abstraction wider than the app needs.

Store review states in Aiven or MariaDB and larger permitted source artifacts in an appropriate object store if necessary. Extra services should solve a demonstrated problem, not add logos.

## Evaluation and team execution

Build a small labelled source set with ordinary pages, dynamic pages, missing fields and inaccessible URLs. Record usable-page rate separately from field accuracy. Track retries, latency and quota consumption per accepted result.

One developer handles acquisition/jobs, one parsing/validation and one the review UI. Markus selects sources and checks the evidence. The first milestone is one page through to a supported field; the second is a graceful failure. A cached fixture is a useful fallback, but must be clearly labelled.

## Preparation and mentor questions

Read the product-specific authentication, request and error documentation. Verify rate limits, concurrency, billing units, asynchronous behavior and retention once an account is available. Do not copy a code sample from a different Oxylabs product without checking its contract.

Ask which product the Junction offer covers, whether credits apply to retries, whether target domains are supported and what can be published in the final repository. **Go:** data acquisition is essential and a tested small request works. **No-go:** source permissions, access or extraction quality remains unresolved.

**Pitch:** show the data source, extracted fact, review decision and failure handling. Distinguish a reliable retrieval pipeline from a guarantee that every web statement is true.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

