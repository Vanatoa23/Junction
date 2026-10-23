# Aiven — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Role and practical value

Aiven is a Tech Partner. Its public platform offers managed open-source data infrastructure. The PostgreSQL documentation describes a hosted relational service with features including JSON data and extensions such as PostGIS. Actual extensions, region and plan should be checked on the instance selected. [Junction](https://2026.hackjunction.com/#partners) · [Aiven](https://aiven.io/) · [PostgreSQL docs](https://aiven.io/docs/products/postgresql)

**Assessment:** a strong candidate for ordinary application persistence because it lets the team focus on the product. The best use may be a deliberately boring database behind an excellent workflow. Do not deploy a distributed streaming stack merely because a platform offers one.

No event credit amount, free-plan entitlement or live database was verified. Public trial language is not the same as an allocation for Junction participants.

## Choose the smallest architecture

For most web prototypes, use one relational database with migrations, seed data and a backend connection pool. Keep connection strings server-side. Use TLS according to the current connection documentation and a least-privilege application user.

Store raw evidence separately from generated conclusions and review states. Add stable IDs and timestamps. A project that uses external research or inference benefits from replayable data even if the database itself is not the pitch's main feature.

Consider additional services only after identifying a concrete requirement. A handful of events can be handled by a table or simple queue. Unfamiliar streaming infrastructure introduces provisioning, schema and operational work that may not help a 48-hour demonstration.

## Project hypotheses and combinations

| Application | Database role | Useful proof |
|---|---|---|
| Bahn dispatch workflow | Orders, assignments and intervention history | Replan without losing state |
| S-Pankki analysis prototype | Synthetic records, calculated results and evidence | Reproducible calculations |
| Evidence-change monitor | Source snapshots, extracted facts and review decisions | Trace a conclusion back to a snapshot |

These are our proposed combinations. They are not joint challenges or proof of access to partner data. MariaDB is an alternative when its features or challenge requirements matter; avoid running both unless there is a specific reason.

## Reliability and evaluation

Test a complete reset → migrate → seed → run cycle. Another teammate should be able to reproduce it. Include duplicate writes, missing records and a temporary connection failure in the acceptance checks. For a small app, these are more important than artificial scale demonstrations.

Measure the end-to-end user workflow. If reporting database performance, specify dataset size, query, index, connection behavior and environment. Do not attribute model or network delay to the database.

One developer owns schema/migrations and access configuration. The others consume agreed backend contracts. Markus checks the data model against the decision and keeps evaluation fixtures interpretable. Do not let every developer edit the same schema without coordination.

## Preparation and access checklist

Read the service getting-started and connection guides. Identify region, plan, billing owner and expiration conditions before provisioning. Document how to stop/delete resources after the event. This report did not provision services or authorize spending.

Prepare a local development fallback with the same database engine/version where practical. A local fallback demonstrates application functionality but not successful hosted integration; state which one the judges are seeing.

Ask about participant credits, eligible services, supported extensions, network access, connection limits, backup/export and the post-event lifecycle. Confirm whether an account requires payment details and whether the team can share access through appropriate roles rather than shared passwords.

**Go:** the service is available promptly and reduces setup burden. **No-go:** account or network constraints block the application. **Pitch:** durable, inspectable state supporting the user result; avoid spending scarce pitch time on infrastructure that is not the innovation.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

