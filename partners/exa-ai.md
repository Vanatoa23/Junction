# Exa.ai — Junction 2026 operational intelligence

> **Roster update — 24 October 2026:** independently confirmed in the official page's partner section as **Challenge**. This update supersedes earlier uncertainty about the listing/tier below. The original product research date remains as stated; API versions, prices and access in the older report have not all been re-tested or re-researched. Challenge briefs remain TBA. [Current coverage and source record](README.md).

**Checked:** 7 October 2026. **Team:** three full-stack developers plus Markus on research, architecture, product and pitch. **Recommendation:** prepare a small, bounded research tool; choose its final use after challenges appear.

**Evidence labels:** CONFIRMED = supported by inspected primary sources; INFERENCE = interpretation; SPECULATION = possible challenge/project. No authenticated API benchmark was run.

## 1. What Exa actually provides

Exa combines web discovery with machine-readable content, reducing the work between finding a URL and reasoning over its evidence. Semantic retrieval helps express a desired source by meaning rather than guessing its keywords. It does not guarantee complete coverage or truthful conclusions.

Ordinary workflow: LLM → search links → choose pages → fetch/parse → reason. Exa workflow: agent → search with content → evidence → reason. The practical benefit is fewer retrieval plumbing steps. It complements RAG: RAG searches your indexed corpus; Exa discovers external material you may not have indexed. [Search](https://exa.ai/docs/reference/search)

## 2. Current product and API status

| Capability | October finding | Build implication |
|---|---|---|
| Search | `POST /search`; content can accompany results | Start here |
| Content | `POST /contents`; text, highlights, summaries, metadata and links | Fetch selected known URLs |
| Deep search | Synthesized, structured output with grounding | Useful for difficult questions |
| Managed Agent | Async `/agent/runs` workflow | Avoid building every research step yourself |
| Monitoring | Native recurring search and webhooks | No scheduler required for basic discovery |
| MCP | Hosted MCP, plus Python/JS SDKs | Fast developer exploration |
| Dynamic Highlights | Explicit research preview | Optional experiment, not core dependency |
| Legacy neural/keyword/find-similar | Not represented as current modes/endpoints in inspected reference | Do not copy old examples blindly |

The present search enum is `instant`, `fast`, `auto`, `deep-lite`, `deep`, `deep-reasoning`. Keyword matching and hybrid retrieval are implementation concepts, not verified selectable current `keyword`/`hybrid` modes. The old find-similar URL failed to load; current availability remains unresolved. [API reference](https://exa.ai/docs/reference/search), [Agent](https://exa.ai/docs/agent/quickstart), [changelog](https://exa.ai/docs/changelog)

## 3. Why agents benefit

Exa can reduce keyword dependence, HTML parsing, repeated page opening and irrelevant context. It cannot eliminate spam, duplication, stale evidence or citation mistakes. Useful tasks include discovering niche suppliers, finding relevant papers, comparing product changes and assembling due-diligence evidence. Regulatory work still needs authoritative sources; expert discovery still needs identity checks.

## 4. Modes and query strategy

| Mode | Best use | Poor fit | Trade-off |
|---|---|---|---|
| instant | Interactive lookups | Exhaustive research | Minimum latency |
| fast | Live agent tools | Complex synthesis | Faster retrieval |
| auto | Default discovery | Strict exhaustive claims | Balanced |
| deep-lite | Small synthesized answer | Difficult investigation | Docs describe ~4 seconds |
| deep | Query expansion and synthesis | Autocomplete | More time/cost |
| deep-reasoning | Complex analysis | Simple fact lookup | Highest reasoning effort among search modes |

Use `includeDomains`/`excludeDomains` rather than assuming search-engine `site:` syntax. Publication dates are not crawl freshness. Company/people categories reject some filters. Start with five results, expand only when missing evidence justifies it. [Search](https://exa.ai/docs/reference/search), [Deep guide](https://exa.ai/docs/search/deep-search)

**Query lessons:** describe the desired evidence; split discovery from verification; keep identifiers exact; try local-language queries; seek contradictory evidence; restrict authoritative verification by domain; broaden failed searches; measure gains before choosing deeper modes.

## 5. Extraction and context

Use highlights first, then full text for shortlisted sources. `maxAgeHours` controls cached-content age; `0` requests fresh fetching, `-1` cache only. Separate contents requests accept up to 100 IDs or URLs and report per-item status. JS rendering/paywall success was not demonstrated: test your actual target sites and never assume access to restricted material. [Contents reference](https://exa.ai/docs/reference/get-contents)

Store source URL, retrieved excerpt, retrieval time and claim mapping. A generated summary is not an original quotation. Limit excerpts before sending them to the LLM; enlarge context only to resolve ambiguity. [Highlights](https://exa.ai/docs/search/highlights), [Contents guide](https://exa.ai/docs/contents/quickstart)

## 6. Integration and time estimates

Create a dashboard key; keep `EXA_API_KEY` server-side. REST uses `x-api-key` or Bearer authentication. Official packages are `exa-py` and `exa-js`. [SDK/index](https://exa.ai/docs/llms.txt)

```python
import os
from exa_py import Exa
exa = Exa(api_key=os.environ["EXA_API_KEY"])
results = exa.search(
    "Finnish research groups working on food waste forecasting",
    type="auto", num_results=5,
    contents={"highlights": True},
)
```

This follows the current documented pattern; it has not been executed here. Pin SDK versions and run a smoke test.

**Estimates:** first query 15 minutes; usable content one hour; model tool integration one hour; useful research agent several hours. OpenAI/Anthropic tool calling and MCP have official paths; Gemini can use a generic function wrapper. LangChain/LlamaIndex integrations are listed, but add a framework only if your team already uses it. [OpenAI example](https://exa.ai/docs/integrations/tool-calling/openai), [MCP](https://exa.ai/docs/get-started/exa-mcp)

## 7. Cost, limits and Junction access

| Published item | Price/allowance |
|---|---|
| Starter | $10 monthly credits plus $10 onboarding bonus |
| Instant | $4/1,000 requests, up to ten results |
| Fast/auto | $7/1,000 |
| Deep / deep-reasoning | $12 / $15 per 1,000 |
| Separate contents | $1/1,000 pages per content type |
| Summaries | $1/1,000 pages |
| Monitors | $15/1,000 requests |
| Fixed Agent effort | $0.012–$1/run; other usage can add charges |

Starter advertises ten search QPS and 50 Agent concurrency; public search limit is 100 results, with mode-dependent limits. Search text/highlights for the first ten results are included according to the pricing update. [Pricing](https://exa.ai/pricing)

**Planning calculation:** 500 auto searches ≈ $3.50; 1,000 deep-reasoning searches ≈ $15; 100 high-effort Agent runs ≈ $50 before extras. Thus ordinary testing is affordable, but unbounded agents can exhaust credits. Model inference is additional. No Junction-specific credits or special accounts were verified.

## 8–9. Alternatives and Cala

These are tool-selection judgments, not measured rankings.

| Alternative | Prefer it when | Why consider Exa |
|---|---|---|
| Google/Bing | Manual exploration or existing search access | Integrated machine-readable evidence |
| Tavily | Existing agent-search/extraction stack | Compare retrieval on actual tasks |
| Brave Search API | Search-result grounding from its independent index | Compare integrated extraction |
| Perplexity APIs | Existing research/search integration | Compare control and evidence quality |
| Scraping | Known pages and deterministic field extraction | Unknown-source discovery |
| Vector RAG | Private, curated documents | Open-web expansion |
| LLM browsing | One-off human-supervised research | Repeatable application tool interface |
| Cala | Typed facts in supported domains | Wider narrative evidence discovery |

Sources: [Tavily](https://docs.tavily.com/documentation/api-reference/endpoint/search), [Brave](https://api-dashboard.search.brave.com/app/documentation/web-search), [Perplexity](https://docs.perplexity.ai/docs/search/quickstart), [Cala](https://www.cala.ai/).

Cala describes preprocessing public information into structured, sourced facts. However, **Exa also offers structured entity data and premium data connections**: “Exa unstructured, Cala structured” is a useful starting distinction, not a strict boundary. Cala API coverage/access was not verified here.

**Exa alone:** niche research discovery, documentation investigation, recent narrative news. **Cala alone, conditional on coverage:** filing facts, entity attributes, normalized historical comparisons. **Both:** supplier facts plus disruption evidence; company fundamentals plus announcements; institutional facts plus research collaborators. Resolve entities and dates before joining data.

## 10–11. Direction and event evidence

CONFIRMED: 2025 Websets emphasized complex entity discovery; its vendor benchmark is not independent proof. In 2026, Agent/Connect, publications and monitoring indicate broader research infrastructure. Dynamic Highlights remains preview. [2025 benchmark](https://exa.ai/blog/websets-evals), [2026 changelog](https://exa.ai/docs/changelog)

September's Snapshot announcement creates an interesting historical-evaluation option; availability/coverage need testing. [Announcement](https://exa.ai/blog/exa-snapshot)

Exa credits were advertised at HKUST's 2026 hackathon, demonstrating general hackathon support, not Junction entitlement. No Exa-specific Junction 2025 winning project or judging comments were verified. Junction 2026 tracks remain TBA; Exa's precise partner role was not independently resolved from the extracted public page. [HKUST](https://cse.hkust.edu.hk/GDGoChackathon2026/hackathon), [Junction](https://2026.hackjunction.com/)

## 12. Possible challenge directions

All are SPECULATION; probability is relative plausibility, not an announced forecast.

| Theme | Probability | Possible brief / build | Why Exa; 48h fit |
|---|---|---|---|
| Research agents | High | Answer a difficult operational question | Evidence discovery; good |
| Hard entity discovery | High | Find suppliers meeting unusual constraints | Semantic retrieval; good |
| Monitoring | Medium | Detect meaningful emerging events | Native monitors; good |
| Expert matching | Medium | Find researchers for a practical problem | Publication/people discovery; good |
| Due diligence | Medium | Surface evidence gaps before a decision | Multi-source verification; bounded MVP |
| Historical evaluation | Low | Test evidence available at a past date | Snapshot; coverage risk |

Evidence for plausibility is product emphasis above; no challenge statement is confirmed.

## 13. Reusable architecture patterns

| Pattern | Suitable problem / strength | Complexity; demo; failure |
|---|---|---|
| Question → search → synthesis | Cited briefing | Low; immediate; unsupported claim |
| Discover → verify | Supplier shortlist | Medium; reveal evidence; wrong entity |
| Internal facts + web evidence | Decision support | Medium; changed ranking; bad join |
| Search → gap → search | Complex research | Medium; visible reasoning steps; loops |
| Monitor → prioritize | Event triage | Medium; replay new event; missed discovery |
| Publication → expert shortlist | Collaboration discovery | Medium; evidence cards; stale affiliation |
| Claim → counterevidence | Verification | Medium; contradiction; absence mistaken for falsity |
| Historical sources → evaluation | Temporal testing | High; date comparison; incomplete archive |

## 14–15. Evaluation and judging

Run four small experiments: precision@5 on ten tasks; supported-claim fraction on 20 claims; end-to-end time/cost on five tasks; one-step versus bounded two-step research on ten questions. Use the same model and prompts, blind source ratings and a fixed budget. Recall requires a known reference set; do not claim open-web recall from a tiny sample.

Pitch actual results: “Relevant sources increased from A to B across ten tasks,” with sample size and limitations. No performance result is claimed here.

INFERENCE: judges may value difficult discovery, evidence quality and measurable user benefit. One search call can be excellent if it solves the core problem; API-call count is not merit. A generic results screen or elaborate pipeline without a decision outcome is weak.

## 16–17. Project seeds and partner combinations

All combinations are conditional on challenge permission, data and access; they are not verified integrations.

| Seed / user | 48h MVP and live demo | Metric / partner |
|---|---|---|
| Supplier disruption scout / buyer | Ten suppliers, evidence-ranked alerts | Useful-alert precision; Valio Aimo + Cala |
| Municipal precedent finder / planner | Five comparable interventions with source cards | Relevant precedent@5; Espoo |
| Research collaborator finder / lab | Problem → papers → five experts | Verified match rate; Aalto |
| API migration investigator / developer | Version change → affected patterns → evidence | Supported fix rate; OpenAI/Gemini |
| Procurement evidence checker / analyst | Public claims → supporting/conflicting sources | Supported claim fraction; Cala |
| Emerging technique scout / engineer | Topic → research change → relevance cards | Novel useful findings; Modal/Verda |

Exa is essential only where discovering external evidence materially changes the result. Strong combinations are Cala for facts, OpenAI/Google models for synthesis, Espoo for local constraints, Valio for operational context, Aalto for research users, and Modal/Verda for execution where needed. Arduino/NVIDIA require a concrete hardware or compute need; Hostinger/Cloudinary are delivery choices. AfterQuery/Featherless roles were not verified, so no specific capability claim is made.

## 18–19. Bounded loops and monitoring

Implement: decompose into at most three questions → search → deduplicate URLs and syndicated text → identify unsupported required fields → one follow-up round → cite or abstain. Cap six calls, five results/call, elapsed time and spend. Stop when required fields have adequate evidence or budget expires; model confidence alone is insufficient. Treat retrieved instructions as untrusted data.

Native Monitors schedule searches, deduplicate previously returned findings and deliver webhook output. Your application still handles persistence, business relevance, notifications and signature verification. Discovery of new pages is not guaranteed detection of every edit to a known page; deterministic page diffs need separate content snapshots/hashes. [Monitors](https://exa.ai/docs/monitors/quickstart)

## 20–22. Preparation, exercise and traps

**Definitely prepare:** account/key, pinned SDK smoke test, highlights/full text, one domain/date filter, timeout/retry handling, citation cards, deduplication and budget caps.

**Worth preparing:** MCP for exploration, a two-step model tool, ten-task evaluation, manual monitor trigger. **Wait:** production scheduling, multiple model frameworks, premium providers and final domain solution.

**Two-hour exercise:** investigate compatibility of three unfamiliar software libraries. First search finds official docs; second resolves one missing compatibility fact. Fetch selected pages, ask an LLM for a cited comparison and manually score ten claims. Success: two search rounds, ≥8/10 supported claims, recorded latency and cost, and explicit unknowns. This is a practice target, not a result.

Main mitigations: authoritative domains for verification; entity/date checks; excerpts per claim; duplicate removal; per-page extraction-status handling; bounded retries on 429/5xx; server-side keys; context caps; finite search rounds; budget logging. Prefer an authoritative API for exact prices, inventory or regulatory records. Do not infer “no event” from no search result.

## 23. Final cheat sheet

| Item | Team takeaway |
|---|---|
| Partner | Exa.ai; precise Junction role unresolved |
| Fundamental value | Web discovery plus consumable evidence |
| Best reason | Find relevant sources otherwise expensive to discover |
| Avoid when | Required facts already exist in an authoritative API |
| Key capability | Search with controlled content |
| Likely themes | Research, entity discovery, monitoring — speculation |
| Fastest architecture | Search → highlights → cited decision |
| Best metric | Task success plus claim support |
| Best combination | Domain data + Exa + model reasoning |
| Judge appeal / weak pitch | Measured benefit / API name-dropping |
| Best preparation | Bounded two-step evidence tool |
| Biggest risk | Unsupported conclusions from incomplete evidence |
| Biggest uncertainty | Actual challenge and access conditions |
| Relevance / confidence | 8/10 / 7/10: subjective assessments |

### Five things our team should remember

1. Start with auto search and short evidence excerpts.
2. Current examples matter because legacy APIs changed.
3. Structured output still requires evidence checks.
4. Bound loops, context and spending before the live demo.
5. Prove a user outcome rather than merely showing search.