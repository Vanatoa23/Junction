# Cala AI — Junction 2026 partner intelligence

**Research cutoff: 7 October 2026.** For Markus and three full-stack developers. Documentation inspected; no authenticated queries were executed. Examples below are documented requests or proposed coverage tests, never claimed live results. **CONFIRMED** means published functionality or a statement; it does not certify data accuracy. **INFERENCE/SPECULATION** identify our recommendations and forecasts.

**Recommendation:** spend two hours validating Cala, then consider an auditable company-research or relationship-based triage agent. Markus’s banking/risk background is useful for evaluation and pitching. Commit only after testing the actual entities, geography and source links. Avoid depending on native triggers.

## 1. What Cala actually supplies

Cala describes a managed entity graph: public information is ingested, normalized and exposed as typed entities and queryable facts. Its documented interface supplies structured rows, sourced prose, entity lookup and entity profiles—not merely URLs. [About Cala](https://docs.cala.ai/)

Typical search flow: `agent → web search → pages → extraction → answer`. Cala’s intended flow: `agent → Cala query/entity → structured facts → application rules → explanation`. The practical advantage is outsourcing ingestion and entity normalization. A database can store equivalent facts, but somebody must acquire and maintain them; an LLM alone does not provide current, inspectable records.

## 2. Where structure helps

**Our architectural assessment:** greatest value comes when identity, comparable fields or relationships determine the next action: supplier screening, company comparison and executive research. UUIDs reduce name-based joins; selected fields reduce repeated page parsing; provenance enables review. These mechanisms can reduce duplicated entities, inconsistent extraction and token consumption, but measured improvements remain unproven for our workload.

Structure does not automatically fix stale facts, incomplete coverage or downstream hallucinations. Open-ended discovery and creative writing often need ordinary search or an LLM instead. RAG is preferable for our own private documents; custom scraping offers control at maintenance cost; proprietary APIs may offer better depth or contractual coverage. A self-managed knowledge graph offers domain control but adds ingestion and modeling work.

## 3. Current offering and coverage

| Interface | Documented operation | Output |
| --- | --- | --- |
| `POST /v1/knowledge/query` | Natural-language or dot-notation input | `results` rows plus entity mentions |
| `POST /v1/knowledge/search` | Same input, prose output | `content`, `context`, `explainability`, `entities` |
| `GET /v1/entities?name=…` | Fuzzy name lookup, optional type filter | UUID, name, type, description |
| `GET /v1/entities/{id}/introspection` | Discover available fields | Properties, relationships, numerical observations |
| `POST /v1/entities/{id}` | Select properties and relationships | Entity facts and relationship records |
| Remote MCP | Five tools corresponding to these operations | Agent-accessible results |

Sources: [Query](https://docs.cala.ai/api-reference/query), [Search](https://docs.cala.ai/api-reference/search), [Entity search](https://docs.cala.ai/api-reference/search-entities), [Introspection](https://docs.cala.ai/api-reference/entity-introspection), [Retrieval](https://docs.cala.ai/api-reference/entities).

Finance, healthcare, legal, HR and agro are advertised. Finance has the clearest source catalogue: SEC filings, corporate registries, ownership, sanctions, ratings, regulatory statistics and market/news sources. That catalogue is a coverage claim, not proof that every record is queryable. [Finance](https://www.cala.ai/industries/finance)

Documented types include Company, Person, Law, Sanction, CorporateEvent, FinancialMetric, Commodity and geographical entities. No complete country inventory, per-domain refresh schedule or healthcare/HR/agro completeness matrix was found. Test Finnish and Estonian entities early; do not promise patient records, exhaustive legal updates or live prices.

## 4. Developer experience and minimum integration

Create a free account in the [console](https://console.cala.ai/) and generate an API key. Raw HTTP is enough; documentation includes Python `requests` and JavaScript `fetch`. No dedicated Python/TypeScript SDK was established in the inspected index. [Quickstart](https://docs.cala.ai/quickstart)

Minimal request, adapted from the quickstart; requires a real key and was not executed:

```bash
curl --fail-with-body --max-time 30 \
  https://api.cala.ai/v1/knowledge/query \
  -H "X-API-KEY: $CALA_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"input":"startups.location=Spain.funding>10M.funding<50M"}'
```

MCP endpoint: `https://api.cala.ai/mcp/`, normally with `X-API-KEY`. Claude Desktop has a documented OAuth connector; Claude Code has HTTP MCP configuration. n8n has a documented community node. OpenAI integration is explicitly discussed; **Cala warns dynamic tool schemas are incompatible with strict mode and specifies `strict: false`**. Gemini/LangChain can use a REST wrapper; a Cala-specific Gemini recipe was not verified. [MCP](https://docs.cala.ai/integrations/mcp), [n8n](https://docs.cala.ai/integrations/n8n)

**Team estimates:** first query **15 minutes**; one agent tool **1 hour**; useful prototype **several hours**. Untested domain coverage is **risky**. Likely blockers: authentication, remote-MCP configuration, dynamic fields, missing entities and rate limits. Documentation is actionable, but contains inconsistent examples; prefer the versioned API reference and live response over copied feature snippets.

## 5. Pricing and Junction access

| Public plan | Monthly price | Included credits | Requests/minute | Seats |
| --- | --- | --- | --- | --- |
| Starter | Free | 100/month | 10 | 1 |
| Explore | $50 | 1,100/month | 100 | 1 |
| Build | $200 | 5,000/month | 100 | 5 |

Published rule: **one credit = one query**. Top-up: $50/1,000 credits; purchased credits do not expire. Plan top-up caps are 1,000/2,000/2,500 respectively. Failed calls, entity-operation billing and monthly rollover need confirmation. [Pricing](https://www.cala.ai/#pricing)

No Junction-specific allocation or activation instructions were located. Make an account beforehand, but do not purchase a team plan speculatively. Confirm seats, credits and rate limits with mentors. At 100 credits, repeated five-call workflows can exhaust preparation quickly.

## 6. Ten concrete query probes

**D = documented example/model; P = proposed query requiring a live coverage test.** “Returns” describes expected documented shape, not a verified answer. Sources: [structured examples](https://docs.cala.ai/features/structured-answer), [search examples](https://docs.cala.ai/api-reference/search), [introspection](https://docs.cala.ai/api-reference/entity-introspection).

| Query/probe | Returns if covered | Why structure matters / hackathon use |
| --- | --- | --- |
| D: `startups.location=Spain.funding>10M.funding<50M` | Funding/company rows and UUIDs | Filter a deal shortlist |
| D: `companies.industry=fintech.founded_year>=2020` | Query-dependent company rows | Cohort comparison |
| D: `people.role=CEO.company.industry=AI` | People/company rows | Resolve outreach candidates |
| D: `OpenAI.founded.year` | Structured fact | Test a basic known answer |
| D: “Who founded Stripe and what is their background?” | Prose, entities, evidence | Build a source-backed dossier |
| D: “What regulations affect fintech companies in the EU?” | Sourced prose | Triage relevant rules, then inspect originals |
| D: Entity retrieval with `IS_DIRECT_PARENT_OF` | Related entity records if present | Explain a corporate hierarchy |
| D: Entity retrieval with `IS_BENEFICIARY_OWNER_OF` | Ownership relationships if present | Ownership-review prototype |
| D: Introspection-selected `FinancialMetric` | Numerical observations if present | Comparable financial facts |
| P: “What sanctions records relate to [resolved company]?” | Query-dependent rows/evidence | Flag records for human review; absence means unknown |

For healthcare/agro, first resolve a known organization/product and inspect its fields. For events, inspect `PARTICIPATES_IN_CORPORATE_EVENT`; do not infer a monitoring subscription from an event entity.

## 7. Entities and relationships

Lookup returns a Cala UUID and type. Profiles can include aliases, CIK and LEI. Introspection exposes actual edges such as `IS_CEO_OF`, `IS_SUBSIDIARY_OF`, `IS_DIRECT_PARENT_OF` and `IS_BENEFICIARY_OWNER_OF`. [Entity schema](https://docs.cala.ai/api-reference/entity-introspection)

This supports bounded exploration: `company → related company/person → inspect facts → triage`. Use the returned identifiers and actual relationship names; never assume name equality proves identity. A complete `ownership → sanctions` chain remains coverage-dependent. Structured edges avoid asking an LLM to invent joins from text, but still require identity and source validation.

## 8. Freshness and traceability

Entity examples attach source name, document URL or endpoint, date and sometimes response hash. Relationship examples include `valid_since`/`valid_until`; historical validity is therefore represented, but a universal time-travel interface is not established. [Profile example](https://docs.cala.ai/features/retrieve-entity), [relationship example](https://docs.cala.ai/api-reference/entities)

Search examples map claim reference UUIDs to provenance records. However, documentation examples contain apparent mismatches between claims and referenced content: source presence is not proof of source support. Inspect that mapping. [Natural-language answer](https://docs.cala.ai/features/natural-language-answer)

“Verified” is Cala’s assertion; the inspected materials do not disclose a reproducible verification protocol, disagreement policy or general freshness SLA. Display source date separately from fetch time. Never label a dated source “updated now” because we queried it now.

## 9. Cala versus Exa

Exa also documents structured company entities: describing it as merely ten links would be misleading. [Exa Search](https://exa.ai/docs/reference/search), [Exa MCP](https://exa.ai/docs/get-started/exa-mcp)

| Capability | Cala | Exa |
| --- | --- | --- |
| Open-web discovery | Knowledge querying; not a conventional crawl interface | Core search/page retrieval |
| Structured data | Query rows and entity profiles | Structured company entities also documented |
| Entity resolution | Fuzzy lookup, UUIDs, aliases | Entity IDs; equivalent graph depth not established here |
| Fresh information | Claimed; no general cadence found | Search/content controls; not universal freshness |
| Citations | Claim references and profile sources | Result URLs and retrieved evidence |
| Semantic search | Natural-language knowledge querying | Search modes for web discovery |
| Agent integration | REST tools | REST tools and agent products |
| MCP | Hosted authenticated server | Hosted MCP |
| Best use | Covered facts and relationship workflows | Broad discovery and contextual evidence |

**Use Cala** when known entities and fields drive decisions. **Use Exa** for missing context, discovery or new pages. **Use both** as `Cala facts + Exa evidence → identity/source checks → rules → LLM explanation`; preserve disagreements rather than silently merging them.

## 10–11. Direction and hackathon history

**CONFIRMED statements:** a founder announced public self-service access and a free tier; current documentation emphasizes MCP and developer integration. Cala’s own updates describe Comets builder sponsorship and its August 2026 Barcelona hackathon. An organizer lists a Cala/Krea creative-data hackathon for **10 October**, still future at this cutoff. [Founder announcement](https://www.linkedin.com/posts/elisendabou_were-finally-open-14-months-ago-activity-7459601462898266112-NJCs), [Cala updates](https://www.linkedin.com/company/cala-ai/), [October event](https://www.tech-week.com/calendar/sf/events/creative-data-hackathon-with-krea-and-cala-ec9da888-037b-484d-abe4-1ab2be5ce899)

These suggest developer adoption, trustworthy context and demonstrable applications. No reliable Junction 2025 challenge/winner record was found; that does **not** establish first-time participation. A dated technical-release chronology, hiring specialties and API changelog were not verified.

The supplied brief identifies Cala as a Challenge Partner, but the retrieved Junction page does not independently expose that listing in text. It says tracks are TBA. Treat the brief as supplied context and verify the track before committing. [Junction 2026](https://2026.hackjunction.com/)

## 12. Likely challenge directions

All are **SPECULATION**; probabilities are qualitative judgments, not forecasts of announced tracks.

| Theme / likelihood | Evidence basis | Possible statement → build | Cala role / 48-hour feasibility |
| --- | --- | --- | --- |
| Trustworthy agents / High | Provenance emphasis | “Make decisions inspectable” → evidence-gated task agent | Facts determine actions / High |
| Corporate intelligence / High | Company relationships | “Understand companies” → supplier dossier | Resolve identities/edges / High if covered |
| Finance/risk / Medium | Finance catalogue | “Surface hidden risks” → review queue | Relationship facts / Medium |
| Change monitoring / Medium | Event types, trigger roadmap | “Respond to change” → polled fact-diff inbox | Snapshot facts / Medium |
| Creative data applications / Medium | Cala/Krea event | “Make data useful” → explainable entity explorer | Connected facts / High |
| Healthcare/legal research / Low–Medium | Advertised domains | “Navigate specialist knowledge” → sourced organization/rule finder | Domain facts / Coverage-risky |

## 13. Reusable architectures

**Our proposed patterns**, adaptable after live coverage tests:

| Pattern | Suitable problem / advantage | Complexity / demo | Main failure |
| --- | --- | --- | --- |
| Resolve → inspect → explain | Company dossier; stable identity | Low / clickable facts | Wrong match |
| Retrieve → rule → review | Supplier triage; deterministic decisions | Medium / explain flagged rule | Missing edge |
| Cala + Exa → compare | Research; broader evidence | Medium / show disagreement | False join |
| Poll → normalize → diff | Fact-change inbox | Medium / replay labeled snapshots | Formatting creates false change |
| Query → filter → shortlist | Company discovery | Low / exclusions explained | Incomplete population |
| Evidence → bounded agent step | Action proposal; abstention | Medium / draft accepted or withheld | LLM adds unsupported claims |

## 14–15. Judge appeal and measurable value

**INFERENCE:** make Cala essential by letting its identity, edges and sourced fields determine an observable application decision. Show the record, rule and evidence side by side. A generic chatbot, isolated API call or five-query dashboard is weak unless it demonstrates useful behavior beyond displaying data.

Run a small paired evaluation: same model/prompt, fixed tool budget and ten independently checked tasks, with web search versus Cala. Freeze outputs and use identical scoring; report denominators and failures.

| Experiment | Metric | Quick execution |
| --- | --- | --- |
| Ambiguous company names | Correct entity matches / 10 | Manually verify identifiers |
| Required factual fields | Correct supported fields / requested fields | Check original records |
| Evidence support | Supported claims / all claims | Audit every citation |
| Task completion and abstention | Correct decisions; unsupported decisions | Include missing-data cases |
| Operational cost | Tokens, calls, wall time, credits | Log both pipelines identically |

Use “A/10 to B/10 on our test set,” only after measurement. Do not extrapolate ten cases to universal accuracy or quote placeholder homepage counters as benchmarks.

## 16. Adaptable project seeds

Each is **our proposal**. Cala is essential only if removing its facts/relationships breaks the stated workflow.

| Problem → idea | Why structure/Cala matters | 48-hour MVP and live demo | Metric / combination |
| --- | --- | --- | --- |
| Supplier identity confusion → Evidence Passport | UUID-linked legal identity | Three suppliers; resolve ambiguity and show sources | Match accuracy / Exa |
| Hidden corporate links → Relationship Review | Retrieved ownership edges | One-hop graph with review queue | Verified edges / OpenAI |
| Incomparable companies → Peer Brief | Typed fields and periods | Five-company comparison, missing-field handling | Supported field coverage / Gemini |
| Stale dossiers → Fact Delta | Entity snapshots and validity | Three tracked entities; labeled replay of one change | False-change rate / Modal |
| Research assertions unsupported → Claim Gate | Provenance-linked claims | Withhold an unsupported recommendation live | Unsupported claim rate / Exa |
| Partner search overload → Fit Shortlist | Entity attributes drive filters | Ten candidates and explicit exclusions | Verified eligibility / Aalto-context project |

## 17. Cross-partner combinations

**Our five strongest functional combinations:** Cala + Exa for discovery/evidence; Cala + OpenAI for bounded reasoning; Cala + Gemini for an alternative reasoning layer; Cala + Modal for scheduled workers/evaluation; Cala + Verda for hosting a chosen open-model workflow, subject to actual access and service fit.

AfterQuery might fit evaluation, but its relevant product/access was not verified here. Featherless/NVIDIA become useful only if open-model serving is already justified. Espoo/Aalto/Valio Aimo could supply domain problems, but require real challenge datasets. Arduino adds little to company intelligence unless a genuine physical workflow exists; Cloudinary helps media presentation, not fact reliability. These are integration ideas, not verified sponsor bundles or credits.

## 18. Triggers: current status

**Available in documentation:** querying entities and retrieving event relationships. **Roadmap:** pricing marks triggers “coming soon.” No public trigger/webhook subscription contract was found in the documentation index. [Pricing](https://www.cala.ai/#pricing), [Index](https://docs.cala.ai/llms.txt)

A [third-party hackathon repository](https://github.com/frankterpo/tech_eu_paris_2026) describes Cala trigger monitoring, while an [official-domain Entity Watch demo](https://entity-watch-demo.apps.cala.ai/) is indexed as capped demonstration data. Neither establishes generally available trigger access. Ask mentors about private access; otherwise use sparse polling and explicit demo replay. One query every five minutes is 288/day, already above Starter’s monthly allowance.

## 19–20. Preparation and two-hour exercise

**Definitely prepare:** account/key, one REST query, one MCP connection, identity lookup, introspection, profile source inspection, credit/error logging. **Worth preparing:** one agent wrapper and a five-case search comparison; a snapshot-diff function using saved responses. **Wait:** full monitoring infrastructure, healthcare/ownership compliance claims, broad graph traversal and testing multiple model frameworks.

Exercise: build a **three-company fact card** unrelated to the eventual challenge. Spend 20 minutes on query/MCP, 30 on lookup/introspection, 30 retrieving selected facts and evidence, 25 generating a bounded explanation, and 15 testing an ambiguous name, missing field and failed request.

Success: three resolved profiles, at least one inspectable source per card, unknown fields displayed honestly, no invented values, and recorded calls/cost. Use whichever agent framework the developers already know. Markus checks ground truth; one developer owns integration, one data/UI, one evaluation.

## 21. Risks and practical mitigations

| Trap | Mitigation |
| --- | --- |
| Finnish/Baltic coverage absent | Test target entities before choosing the idea |
| Missing record mistaken for “safe” | Represent unknown separately from negative |
| Dynamic schema/currency strings | Validate locally; normalize units, periods and nulls |
| Stale or conflicting evidence | Display dates and disagreements; inspect originals |
| Credit/rate exhaustion | Cache, bound calls, back off on 429; verify billing |
| API/example inconsistency | Save successful request/response fixtures; inspect fields |
| LLM invents despite correct data | Gate decisions with rules and validate cited claims |
| Unreleased triggers | Poll sparingly or use labeled replay |

## 22. Cala cheat sheet

| Item | Team answer |
| --- | --- |
| Partner | Cala AI; Challenge Partner status supplied, independently recheck |
| Fundamental product | Managed queryable entity/fact layer |
| Best reason to use | Covered relationships and evidence drive decisions |
| When not to use | Arbitrary discovery, private documents, guaranteed live feeds |
| Current domains | Finance, healthcare, legal, HR, agro advertised; coverage unevenly documented |
| Primary integration | REST or remote MCP |
| Likely themes | Trustworthy agents, corporate intelligence; speculative |
| Most valuable capability | Entity retrieval with relationships and provenance |
| Fastest architecture | Resolve → introspect → retrieve → rules → explanation |
| Best combination | Exa + Cala, when broader evidence is necessary |
| Impress / bore judges | Measured decision improvement / decorative API use |
| Best metric | Correct, source-supported task decisions |
| Best preparation | Two-hour fact-card exercise |
| Biggest uncertainty | Actual domain/geographical completeness and event access |
| Biggest technical trap | Treating flexible query output as a fixed guaranteed schema |
| Hackathon relevance | **8/10**, our judgment, conditional on coverage |
| Understanding confidence | **6/10**: docs inspected, runtime untested |

### Five things our team should remember about Cala

1. Resolve identities before reasoning about relationships.
2. Inspect sources instead of trusting the word “verified.”
3. Test the exact companies and geography before committing.
4. Native triggers remain unconfirmed for public use.
5. Measure what Cala changes in the decision, not how many times we called it.