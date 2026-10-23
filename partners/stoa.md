# Stoa — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Identity and opportunity

The Junction roster links Stoa to **stoabuild.com**, an AI construction-project information product. This resolves the name ambiguity: it is not an unrelated education or finance business. Stoa describes connecting information from existing site systems into a unified project layer. It presents search/navigation and project information as core product concerns. Treat its advertised productivity figures as vendor claims, not a baseline our prototype has reproduced. [Junction](https://2026.hackjunction.com/#partners) · [Stoa](https://stoabuild.com/)

**Assessment:** a strong fit for three full-stack developers if the challenge provides realistic documents. The valuable problem is answering the right question from the right project revision, not building a generic PDF chatbot. The 2026 brief and public API entitlement were not verified.

## Understand the decision

Construction information can describe a location, drawing, revision, task, contractor and date. Our proposed schema should retain those identifiers. “Latest uploaded” is not necessarily “currently approved.” Ask the mentor how revisions are approved and superseded, and which source wins when documents disagree.

The smallest compelling user journey is a site worker or engineer asking about a concrete work item, seeing the relevant current source and noticing a conflict before acting. Do not assume the challenge includes BIM models, camera footage or access to production integrations.

## Project hypotheses

| Direction | Demonstration | Primary metric |
|---|---|---|
| Revision-aware answers | Reject an obsolete instruction and show the approved revision | Wrong-revision answer rate |
| Change-impact triage | New document change flags affected tasks for review | Relevant impacts found, false alerts |
| Request-for-information preparation | Assemble a question, related evidence and responsible reviewer | Completeness and preparation time |

Prefer revision-aware answers first. Change-impact detection becomes feasible if task/document links exist. Automatic reasoning over a full construction model is a much larger scope and should require a provided baseline.

## Architecture

Use an ingestion pipeline that records file hashes, document IDs, revisions, dates, project/location tags and approval status. Retain page references. Split retrieval into exact metadata filtering followed by semantic ranking. Cite the source passage in the answer and display its revision.

A conflict should create a review item, not be resolved by picking the most fluent text. Keep generated suggestions separate from approved project instructions. The demo should not write changes into a real construction-management system.

A simple frontend needs document history, question/result view and a conflict queue. Use synthetic or sponsor-approved documents for development. Include two almost-identical revisions with one material change; this is a useful test of whether metadata discipline actually works.

## Evidence and execution

Measure answer support, revision correctness and task completion time against manual lookup. Test questions with no answer, conflicting answers and a superseded answer. Avoid presenting a polished response as proof that a construction decision is correct.

Give one developer ingestion/versioning, one retrieval/API and one the review interface. Markus defines test cases, decision costs and the business narrative. In the first evening, get one versioned document pair through the complete flow. Add additional formats only after that works.

## Risks, preparation and questions

No self-service API or challenge dataset was established from the reviewed Stoa site. Ask about supported formats, document volume, languages, access controls and the workflow that judges want improved. Also ask what “current” means in their real process.

**Go:** representative documents and a specific task. **No-go:** the entire demonstration depends on integrating multiple inaccessible site systems. A MariaDB vector/relational store could support the provenance model; Cloudinary could manage permitted photos; retrieval from private project files should not be replaced by open-web search.

Prepare only generic version-aware ingestion and evaluation knowledge before the event. **Pitch:** “Here is the outdated instruction; here is the approved one; here is how the user sees the difference.” Report prototype results rather than repeating Stoa's marketing savings.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

