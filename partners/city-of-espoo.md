# Junction 2026 Partner Intelligence — City of Espoo

**Research cutoff: 7 October 2026.** For Markus Vanatoa’s four-person team: three full-stack developers; Markus leads research, data/AI architecture, challenge selection and pitch. **Recommendation: prepare a small public-data integration kit; keep business-advisory, service-access and urban-space concepts open until the brief arrives.**

Evidence labels: **CONFIRMED** = supported by a cited source; **INFERENCE** = reasoned interpretation; **SPECULATION** = proposed challenge or product. Probability ratings are relative preparation priorities, not statistical forecasts. Integration times are engineering estimates after access is available. APIs were documentation-checked, **not live-tested**; no uptime guarantees were verified.

## 1. Who owns the partnership?

**CONFIRMED:** Espoo’s official listing confirms its Junction 2026 partnership and 13–15 November dates. Junction still lists challenge tracks as TBA. **The 2026 department, named owner, datasets and judging rubric remain unverified.** [1][2]

**INFERENCE:** Business Espoo is the strongest historical lead because of the 2025 business-advisory challenge. Digiagenda’s digital-services/data-management team and Espoo Mobility Lab are alternative leads supported by actual programmes—not confirmed Junction owners. Valia Wistuba led the intranet AI experiment; Jenni Selosmaa manages Espoo’s FAIR work. Neither is established as the Junction contact. [3][6][7]

## 2. Active priorities that could shape a challenge

| Problem / why Espoo cares | Current initiative | Remaining difficulty / Junction opportunity |
|---|---|---|
| Entrepreneurs arrive with unclear plans; advisory capacity is valuable | Business Espoo offers preparation, financial planning and human advice [4] | Turn incomplete inputs into an advisor-ready brief with verified next steps |
| Staff struggle to find and interpret guidance | Essi GPT/Copilot/search trial, results published February 2026 [6] | Fragmented formats, weak citations and scaling: show source-quality checks and measurable task completion |
| SMEs need practical, responsible AI adoption | FAIR 2.0, 2026–2028 [7] | Match a specific business problem to a usable service and safe pilot |
| Sustainable travel needs behavioural adoption | Mobility Lab; 2025 AI challenge and 2026 pilot findings [8][9] | Embed decisions in existing event/service journeys |
| Vacant spaces coexist with unmet community needs | Espoo–Aalto Tilaa!, September 2026–December 2028 [10] | Match temporary uses to spaces, permissions and constraints |
| Construction reuse requires reliable supply/demand information | Circular Buildings innovation challenge, pilots intended for spring 2026 [11] | Explain component matching; avoid pretending geometry establishes structural safety |

Education and multilingual access are further credible directions. Energy, nature-based solutions and low-carbon districts have substantial precedent, but Sustainable Future Districts ended in March 2026 and SPARCS in September 2024: use their results as background, not active-programme claims. [12][13]

## 3. Previous Junction challenges: what is actually known

| Item | Finding / confidence |
|---|---|
| 2025 statement | **CONFIRMED title:** “Business Advisory Service 2.0”, City of Espoo, in Junction’s official archive [3] |
| Owner / expected users | Business Espoo connection supported by a public participant profile; entrepreneurs and advisors demonstrated in participant projects [5] |
| Problem / solution pattern | Participant “Espoo Pre-Advisor”: guided intake, blockers, startup pathway, checklist and advisor brief. This describes a submission, not the full official brief [5] |
| Datasets/APIs, rubric | Not recovered; do not assume CRM, calendar or confidential case access |
| Results | A developer portfolio reports second place for an advisory preparation tool. No independently verified first-place project or official judge explanation recovered [5] |
| Continuation | No confirmed post-Junction deployment found |
| 2024 | No reliable Espoo-specific statement recovered; absence of retrieval is not absence of participation |
| Earlier | Archive lists 2018 “Business at your Fingertips” and “Analyzed Information at your Fingertips”; titles alone weakly support a recurring information-to-action theme [3] |

**Implication:** intake summarisation was already built in 2025. Differentiate through verified routing, completeness checks, structured financial calculations or demonstrably better advisor preparation—not a rebranded chat interface.

## 4. Other innovation programmes

**CONFIRMED:** Innovation Challenge Engine for Cities structures municipal problems for company co-development. The mobility competition explicitly pointed builders to HRI, Digitransit and Digitraffic. Circular Buildings used market dialogue and tendering; winning a prototype competition does not imply procurement. [8][11][14]

The strongest observed outcome is **NinjaLABO’s Event Talks**, winner of the separate 2025 mobility challenge. It combined journey options and context, then piloted at RecoTech. Espoo’s September 2026 report says uptake remained modest amid competing event tools. **INFERENCE:** city judges may value distribution and integration as much as algorithm novelty. [9]

## 5. Ranked data shortlist

Freshness below describes publisher documentation, not independently observed timestamps. “Unspecified” means verify it before selecting the source. These are 12 practical resources, not a promise that all are needed.

| Rank / resource and official link | Contents / format | Freshness | Useful build / estimated integration |
|---|---|---|---|
| 1. [Service Map](https://hri.fi/data/en/dataset/paakaupunkiseudun-palvelukartan-rest-rajapinta) | Metropolitan facilities, services, accessibility; REST/JSON, WFS | Maintained; cadence unspecified | Service/venue finder; **1 hour** |
| 2. [Digitransit](https://digitransit.fi/en/developers/apis/) | Routes, stops, itineraries; GraphQL | Schedules plus live predictions | Reachability and travel comparison; **1 hour** after key |
| 3. [Espoo events](https://hri.fi/data/en/dataset/espoon-tapahtumarajapinta) | Events, times, venue links; JSON | Hourly documented | Event/service journey; **1 hour**, validate endpoint |
| 4. [Paavo](https://stat.fi/en/services/statistical-data-services/statistical-databases/paavo) | Postal-area demographics, housing, jobs; PxWeb API | Annual; January 2026 release, reference years lag | Aggregate demand indicators; **1 hour** |
| 5. [Paavo geography](https://stat.fi/en/services/statistical-data-services/geographic-data/geographic-data-by-postal-code-area) | Matching area geometry; GeoJSON/shapefile/WFS | Annual | Join statistics to a map; **1 hour** |
| 6. [Espoo area divisions](https://hri.fi/data/en_GB/dataset/espoon-aluejaot) | Subdistrict/statistical/postal polygons; WFS | Unspecified | Consistent district aggregation; **1 hour** |
| 7. [Espoo buildings](https://avoindata.suomi.fi/data/en_GB/dataset/espoon-rakennukset) | Building polygons; WFS/WMS | Weekly | Site context and footprints; **several hours** |
| 8. [Espoo addresses](https://hri.fi/data/en_GB/dataset/espoon-osoitteet) | Bilingual streets, numbers, coordinates; WFS | Unspecified | Address lookup and joins; **1 hour** |
| 9. [Espoo map layers](https://kartat.espoo.fi/opendata/) | Available planning/base-map and land/water layers; WMS/WFS | Layer-dependent | Planning overlays; **several hours**, discover actual layers |
| 10. [Digitraffic roads](https://www.digitraffic.fi/en/road-traffic/) | Traffic counts, weather, disruption, maintenance; JSON/GeoJSON/MQTT | Many observations every minute | Operational anomaly map; **1 hour** |
| 11. [FMI weather](https://en.ilmatieteenlaitos.fi/open-data-manual-fmi-wfs-services) | Observations/forecasts; WFS stored queries/XML | Product-dependent | Weather-aware recommendation; **1 hour** |
| 12. [HSY air quality](https://www.hsy.fi/en/air-quality-and-climate/air-quality-in-the-helsinki-metropolitan-area/where-can-you-find-air-quality-information/) | Station measurements/index; WFS/WMS, FMI distribution | Hourly | Exposure/context overlay; **1 hour** |

Supplement if mobility wins: [Fintraffic Parking](https://parking.fintraffic.fi/docs/index.html) provides facility metadata and operator-supplied utilisation where available. **No public live queue, general appointment-capacity, municipal energy-meter or building-component condition API was verified.** [15][16][17][18][19][20][21][22][23][24][25][26]

## 6. Real-time integration reality

| Feed | Frequency / coverage | Auth, limits and reliability caveat |
|---|---|---|
| HSL high-frequency positions | Most vehicles publish around once/second; HSL area | Open MQTT, JSON, TLS/WebSocket; filter subscriptions; gaps possible [27] |
| Transit predictions | Dynamic; HSL stops | GraphQL needs registration/key. Old Digitransit GTFS-RT trip-updates endpoint is discontinued; use current GraphQL or HSL’s separate feed [16][28] |
| Rental bicycles | Current station availability, seasonal/operator-dependent | Keyed GraphQL; exact cadence unverified. November operation must be checked [29] |
| Fintraffic parking | Operator-dependent; participating facilities | Public GET without auth; live occupancy not universal; cadence/quota unverified [26] |
| Road traffic/weather | Approximately 1 minute; instrumented roads, not every city street | Public reads; default general limit 60 requests/min/IP without identifying header; gzip required [24][30] |
| FMI / HSY / events | Product-dependent / hourly / hourly | FMI: 20,000 download requests/day, combined 600/5 min; other quotas unverified [17][25][31] |

Digitransit’s overview contains dated/conflicting quota wording: check the subscribed product instead of assuming unlimited access. Cache responses, display source age, and retain a clearly labelled replay for outages. Documentation availability is not an SLA.

## 7. Geospatial patterns achievable in 48 hours

**Recommended:** TypeScript frontend with Leaflet or MapLibre; a thin server adapter; Python/GeoPandas for batch joins if useful. Small extracts need no spatial database. [19–23]

1. Services + transit → travel-time ranking → accessible venue shortlist.
2. Paavo + facilities → aggregate coverage indicator → district map; explain that it is not individual eligibility.
3. Addresses + planning layers → bounded impact checklist → map with source links.
4. Traffic/weather observations → deterministic anomaly rule → operator review queue.

WMS returns rendered maps; WFS returns features. Espoo maintains several layers in **EPSG:3879**: request supported CRS or transform to WGS84 GeoJSON, checking axis order. Discover capabilities and fetch a bounded area. Buildings are not an inventory of vacancies, energy demand or certified material quality.

## 8. What Espoo already does with AI

The Essi experiment compared GPT, Copilot and conventional search. Its GPT corpus contained only 28 documents, so results are not a fair whole-intranet benchmark. Source quality, citations, images and formats were problems; the experiment itself was **not taken into production**. [6]

A June 2026 municipal response describes roughly 380 paid Copilot licences, document-processing and HR use cases, and a curriculum-support experiment halted because of quality deficiencies. **Opportunity:** prove a narrow workflow with traceable evidence, quality gates and unit cost. Do not pitch “Espoo has no AI assistant.” [32]

## 9. Public-sector constraints → design choices

| Constraint | Architecture / prototype implication |
|---|---|
| GDPR minimisation, purpose, retention | Public/synthetic cases; no identity requirement; explicit deletion/retention controls [33] |
| Automated decisions / fairness | Human approves consequential actions; no grant, school or employment eligibility decisions [34] |
| AI Act | Disclose AI interaction; assess intended use. Commission guidance currently places Annex III high-risk obligations in December 2027—do not repeat the old blanket August 2026 deadline [35] |
| Digital accessibility | Keyboard flow, labelled fields, focus/contrast, text alternative to map, accessibility statement plan [36] |
| Finnish/Swedish rights | Both official-language journeys; reviewed terminology and original source available [37] |
| Security / auditability | Server-side keys, limited tool permissions, source/version logs; human confirmation before writes |
| Procurement / lock-in | Small documented adapter, exportable data, replaceable model, explicit integration cost; prototype prize ≠ purchase [11] |

These are deployment implications, not a claim of legal compliance.

## 10. Multilingual differentiation

At end-2025, 25.9% of residents had a foreign mother tongue; leading languages included Russian, Arabic, English, Estonian and Chinese. Business advisory currently offers Finnish, Swedish and English. Ukrainian is a useful candidate only if the challenge’s users support it; it is not established here as a leading local language. [4][38]

Build multilingual **input → structured case → advisor-language summary**, preserving numbers and named services. Markus can help test Estonian. Evaluate Finnish/Swedish with competent speakers. Plain-language forms and multilingual retrieval are stronger defaults than mandatory voice; speech adds privacy, transcription and accessibility work.

## 11. Plausible 2026 themes

All possible statements/products below are **SPECULATION**; evidence-based ranking is **INFERENCE**. None is a confirmed 2026 challenge.

| Theme / relative probability | Evidence | Possible statement; users; data; build / feasibility |
|---|---|---|
| Business advisory / High | 2025 track, current service [3][4] | Prepare entrepreneurs better; entrepreneur/advisor; official guidance + synthetic cases; validated intake/checklist / High |
| Municipal knowledge work / Medium | Essi and Copilot deployments [6][32] | Reduce repeated document work; staff; public policy corpus; evidence-to-action assistant / High |
| Multilingual service access / Medium | Language needs and current service languages [38][4] | Help residents find the right next step; residents; Service Map + guidance; source-backed routing / High |
| Sustainable mobility / Medium | Mobility Lab and pilot [8][9] | Improve event travel choices; attendees; transit/weather/events; embedded comparison / High |
| Temporary space use / Medium | Newly active Tilaa! [10] | Match vacant spaces to community uses; organiser/property officer; public facilities + synthetic availability; map/rules / Medium |
| Circular construction / Low–Medium | Specific 2025–2026 challenge [11] | Match reusable components; planners; sample inventories + geometry; constraint matcher / Medium |
| District resource planning / Low–Medium | Impact evaluation collaboration [39] | Compare service-location scenarios; city analyst; aggregate population/services; coverage map / Medium |

## 12. Municipal workflows worth understanding

These are proposed workflows, not verified descriptions of Espoo’s internal systems.

| User workflow / friction | Data → useful automation / visible value |
|---|---|
| Entrepreneur → preparation → advisor; missing details | Official guidance + synthetic plan → completeness checklist and brief / fewer repeated questions |
| Resident → correct service; terminology/language | Service Map + official pages → intent routing with evidence / fewer navigation steps |
| Staff question → guidance → action; fragmented sources | Public documents → citation-backed checklist / faster task completion |
| Event organiser → travel information; scattered options | Events + transit + weather → embedded travel card / comparison time |
| Community organiser → space → permission; constraints | Facility metadata + synthetic availability → fit ranking / shortlist time |
| Planner → reuse candidate → expert review | Sample component inventory → dimensional/condition flags / fewer impossible matches |
| Analyst → district evidence → resource scenario | Paavo + facilities → explainable coverage comparison / faster scenario preparation |

## 13. What should impress judges?

**INFERENCE:** demonstrate one person finishing one real task faster, then show the city employee’s view, source provenance, uncertainty, cost and pilot integration. A deployable concept has a named workflow owner, accessible fallback and clear boundary between advice and official decisions.

Weak submissions: generic chatbot, unlabeled synthetic “live” data, dashboard without action, unsupported sensitive-system access, another standalone app without distribution, or autonomous consequential decisions. Actual track criteria must override this inferred advice.

## 14. Credible pitch metrics

| Metric | 48-hour measurement |
|---|---|
| Minutes per case | Timed manual vs prototype runs on identical synthetic cases |
| Intake completeness | Required-field coverage against advisor-approved checklist |
| Correct routing | Labelled 20–30 scenario set; report count and ambiguity |
| Evidence support | Fraction of recommendations supported by checked sources |
| Resident steps | Count interactions to a valid next action |
| Language consistency | Same-case outputs checked for service names, numbers and meaning |
| Coverage / reachability | Explicit travel-time threshold; identify missing data |
| Cost / latency | Measured calls, cost per completed task, median and tail latency |

Report small-sample limitations. CO₂ or energy savings are **scenario estimates** with stated factors, not achieved impact. Forecast claims require historical holdout data; skip them when only a short live feed exists.

## 15. Adaptable project seeds

All seeds are **SPECULATION**, bounded to 48-hour prototypes.

| Problem / user | Data + core idea / MVP and demo | Outcome; constraint; combination |
|---|---|---|
| Unprepared advisor appointments / entrepreneur + advisor | Guidance + synthetic plan; completeness and financial sanity checks; edit a case and show revised advisor brief | Preparation minutes; confidential business data; Espoo + OpenAI/DeepMind |
| Wrong service routing / newcomer | Service Map + allowlisted guidance; structured question-to-next-step flow; Finnish/Estonian inputs yield same service | Routing accuracy; language review; Espoo + Exa + model |
| Inaccessible event journeys / attendee | Events + venue accessibility + transit; compare reachable options inside event page | Comparison time; unknown access fields; Espoo + Aalto |
| Idle spaces / community organiser | Buildings/facilities + explicit synthetic vacancy/terms; constraint-based temporary-use matcher; change capacity requirement | Shortlist time; no verified live vacancy feed; Espoo + Aalto |
| Reuse coordination / project planner | Sample component lists + public site context; dimensions/logistics matching; reject incompatible pairs | Valid matches; engineer verifies condition; Espoo + model, Cloudinary only for images |
| Weather disruption / mobility operator | Digitraffic + FMI; explainable threshold review queue; live timestamped map and replay | Alert timeliness; incomplete street coverage; Espoo + Arduino optional |
| Poor service coverage / city analyst | Paavo + Service Map + routing; compare two hypothetical locations | Reachability gain; aggregate ecological bias; Espoo + Aalto |

## 16. Cross-partner combinations

**Proposed combinations, not confirmed joint tracks or supplied credits.**

1. **Espoo + Aalto:** space-use or service-access prototype with evaluation design; clearest institutional overlap.
2. **Espoo + Exa + OpenAI/Google DeepMind:** allowlisted official retrieval → structured, cited next steps; Exa’s official SDK supports search/content retrieval [40].
3. **Espoo + Arduino:** environmental measurement → bounded anomaly → maintenance review, if sensing is essential.
4. **Espoo + Modal/Verda/Featherless:** consider a replaceable inference/compute backend only after verifying event access, residency and actual workload; standard hosted inference may suffice.
5. **Espoo + Cloudinary + Hostinger:** potential image handling and deployment support for reuse/space demos; verify current APIs and credits before committing.

NVIDIA adds value only for a justified vision/edge workload. **Cala AI and AfterQuery integration capabilities were not established in this investigation**: do not assume Cala supplies municipal structured data or AfterQuery an evaluator API. Evaluation remains valuable as our own test harness. This capability uncertainty lowers their current priority.

## 17. Specific Espoo–Aalto signals

| Collaboration | Signal for our team |
|---|---|
| Strategic five-year agreement signed December 2024 | Otaniemi, talent, innovation and learning are established joint priorities [41] |
| Tilaa!, 2026–2028 | Temporary spaces and permission workflows; newly active [10] |
| Educational Partnership, through end-2026 | School–guardian participation and equitable communication; child data makes deployment harder [42] |
| FAIR second phase, from 2026 | Aalto and Espoo both participate; responsible SME AI adoption [7][43] |
| Capital-region impact assessment, 2024–2028 | Quantitative evaluation and policy modelling; supports a rigorous outcome pitch [39] |

The 2026 Kiviruukki housing studio also explored circularity and sustainable neighbourhood design with Espoo. It is evidence of collaboration, not a guaranteed open dataset or Junction track. [44]

## 18. Physical-city opportunities

**SPECULATION grounded in sustainable-district and space-use priorities:** Arduino temperature/humidity sensing for temporary spaces; soil-moisture alerts for nature-based installations; non-imaging occupancy sensing for utilisation. Each is viable only with available hardware and a meaningful operator action. [10][12]

Strong hardware use = a necessary measurement unavailable from public data. A blinking device attached to an advisory chatbot adds little. Avoid cameras for people recognition and avoid claiming energy savings or calibrated environmental accuracy from a weekend bench demonstration.

## 19. Smallest useful preparation set

**Definitely prepare:** bookmark the shortlist; obtain a Digitransit key; fetch one Espoo service extract; display it on a map and accessible list; practise one EPSG:3879 conversion; preserve a timestamped fallback; make a 20-case evaluation template. Check Junction’s current rules before reusing prebuilt code.

**Worth preparing:** one transit query, Finnish/Swedish terminology check, public-source retrieval adapter, basic aggregate scenario analysis. Markus owns evidence and metrics; developers can split frontend, data adapter and workflow prototype.

**Wait for the challenge:** internal service APIs, bookings/CRM writes, forecasts without history, hardware purchases, training models, full digital twin, sensitive resident data and a final product concept.

## 20. A 2–4 hour practice exercise

**Service-data quality explorer:** fetch a small Espoo facility sample from Service Map; normalise bilingual names, coordinates and missing accessibility fields; cluster or count records by service category; display a filterable map plus table. Use deterministic analysis; an LLM may summarise missingness, with every count computed in code.

Plan: 45 minutes fetch/inspect; 45 transform; 60 frontend; 30 quality metrics and replay. **Success:** at least 20 valid Espoo records, correct locations, reproducible missing-field counts, visible timestamps, keyboard-usable list and successful offline replay. A useful missing-data finding is success—it teaches integration without prebuilding a likely final entry.

## 21. Risks and mitigations

| Trap | Mitigation |
|---|---|
| Stale docs / discontinued endpoints | Follow current detailed documentation; test before travel; record response timestamp |
| “Live” means hourly or seasonal | State cadence; November bike availability is an explicit go/no-go check |
| Postal/district/building IDs differ | Match boundary vintage; spatial joins; preserve string IDs and leading zeroes |
| Finnish PDFs / mixed formats | Curate a small corpus; source links and reviewed translations |
| Hallucinated public-service rules | Allowlist, citations, deterministic checks, abstention and human handoff |
| Sensitive or nonexistent integrations | Public/synthetic cases; read-only demo; show integration as future work |
| Licences / event images | Attribute each dataset; respect event-only image restrictions; separate data from code licence [17] |
| Overbuilding / inappropriate AI | One workflow, one outcome, few sources; use rules for calculations and thresholds |

## 22. Final cheat sheet

| Field | Team takeaway |
|---|---|
| Partner | City of Espoo |
| Likely owner/unit | Business Espoo is the strongest historical lead; 2026 owner unknown |
| Likely themes | Advisory, responsible municipal AI, multilingual access; mobility/space use alternatives |
| Most important priority for preparation | Practical service/productivity improvement; team judgement, not a citywide ranking |
| Most useful data/API | Service Map; Digitransit if mobility matters |
| Best geospatial opportunity | Accessible, reachable services or constrained space matching |
| Best AI opportunity | Source-grounded preparation and routing with human handoff |
| Best outcome | Measured minutes saved per completed case |
| Best combination | Espoo + Aalto; Exa/model when public retrieval is needed |
| Impress / bore | Completed workflow with evidence / generic municipal chatbot |
| Best preparation | Service Map extract, map/list, transit key, evaluation cases, replay |
| Biggest constraint | Trustworthy handling of personal data and consequential decisions |
| Biggest uncertainty | 2026 brief, owner, supplied data and rubric |
| Hackathon relevance | **8/10**: accessible data and concrete workflows; subjective team fit |
| Confidence | **6/10** overall: strong programme evidence, limited challenge-specific intelligence |

### Five things our team should remember about Espoo

1. Business advisory is a real historical challenge, but the 2026 brief remains unknown.
2. Source quality and useful workflow completion matter more than merely adding an LLM.
3. Open data is usable, but coordinate systems, seasonal feeds and stale endpoints can consume the weekend.
4. Integration into existing journeys is a stronger adoption story than another optional app.
5. Measure one outcome and show the human approval boundary.

## Source register

Sources accessed 7 October 2026; publication/project dates are stated above where relevant. Participant material is explicitly weaker than official results.

[1]: https://www.espoo.fi/en/events/espooevents%3Aagp767vqb4 "Espoo: Junction 2026 listing"
[2]: https://2026.hackjunction.com/ "Junction 2026: tracks TBA and event rules"
[3]: https://www.hackjunction.com/challenges/ "Junction official historical challenge archive"
[4]: https://www.espoo.fi/en/business-espoo-helping-companies-thrive/book-appointment-business-advisor "Business advisory appointment workflow and languages"
[5]: https://ie.linkedin.com/in/sebastian-kimmel-102075287 "Participant account: Espoo Pre-Advisor"
[6]: https://www.espoo.fi/fi/uutiset/2026/02/espoon-intranetin-tekoalyassistenttikokeilu-toi-uutta-ymmarrysta-tiedonhausta-ja-generatiivisen "Essi trial results, 6 February 2026"
[7]: https://www.espoo.fi/en/news/2026/01/fair-20-helps-smes-harness-ai-safely-and-practically "FAIR 2.0, 23 January 2026"
[8]: https://www.espoo.fi/en/welcome-espoo-ai-mobility-challenge "2025 mobility challenge and data suggestions"
[9]: https://www.espoo.fi/en/articles/ai-mobility-challenge-tested-how-ai-can-support-sustainable-travel "Event Talks pilot findings, 16 September 2026"
[10]: https://www.espoo.fi/fi/tilaa "Tilaa! project, 2026–2028"
[11]: https://www.espoo.fi/en/we-are-looking-solutions-reuse-building-elements-joint-innovation-challenge-helsinki-metropolitan "Circular Buildings challenge"
[12]: https://www.espoo.fi/en/city-and-decision-making/sustainable-development/sustainable-future-districts "Sustainable Future Districts results and end date"
[13]: https://www.espoo.fi/fi/sparcs "SPARCS, 2019–2024"
[14]: https://www.espoo.fi/en/innovation-challenge-engine-cities "Innovation Challenge Engine for Cities"
[15]: https://hri.fi/data/en/dataset/paakaupunkiseudun-palvelukartan-rest-rajapinta "Service Map API catalogue"
[16]: https://digitransit.fi/en/developers/apis/ "Digitransit API overview"
[17]: https://hri.fi/data/en/dataset/espoon-tapahtumarajapinta "Espoo events API, cadence and image licence caveat"
[18]: https://stat.fi/en/services/statistical-data-services/statistical-databases/paavo "Paavo database and vintages"
[19]: https://stat.fi/en/services/statistical-data-services/geographic-data/geographic-data-by-postal-code-area "Paavo geography"
[20]: https://hri.fi/data/en_GB/dataset/espoon-aluejaot "Espoo area divisions"
[21]: https://avoindata.suomi.fi/data/en_GB/dataset/espoon-rakennukset "Espoo buildings"
[22]: https://hri.fi/data/en_GB/dataset/espoon-osoitteet "Espoo addresses"
[23]: https://kartat.espoo.fi/opendata/ "Espoo map-layer documentation"
[24]: https://www.digitraffic.fi/en/road-traffic/ "Digitraffic road data and cadence"
[25]: https://www.hsy.fi/en/air-quality-and-climate/air-quality-in-the-helsinki-metropolitan-area/where-can-you-find-air-quality-information/ "HSY air-quality interfaces"
[26]: https://parking.fintraffic.fi/docs/index.html "Current Fintraffic Parking documentation"
[27]: https://digitransit.fi/en/developers/apis/5-realtime-api/vehicle-positions/high-frequency-positioning/ "HSL high-frequency positioning"
[28]: https://digitransit.fi/en/developers/apis/5-realtime-api/trip-updates/ "Trip-update migration"
[29]: https://digitransit.fi/en/developers/apis/1-routing-api/bicycles-scooters-cars/ "Current rentals and parking GraphQL"
[30]: https://www.digitraffic.fi/en/support/instructions/ "Digitraffic limits and compression"
[31]: https://en.ilmatieteenlaitos.fi/open-data-manual-fmi-wfs-services "FMI WFS and quotas"
[32]: https://espoo.oncloudos.com/cgi/DREQUEST.PHP?id=20261683-21&page=meetingitem "Municipal AI response, 15 June 2026"
[33]: https://www.edpb.europa.eu/topics/key-gdpr-concepts/basic-principles_en "GDPR principles"
[34]: https://www.edpb.europa.eu/documents/guideline/automated-decision-making-and-profiling_en "Automated decisions guidance"
[35]: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai "Commission: current AI Act timeline"
[36]: https://www.traficom.fi/en/about-traficom/accessibility-statements/accessibility-statement-traficoms-websites "Finnish digital-service accessibility requirements in practice"
[37]: https://finlex.fi/fi/lainsaadanto/saadoskokoelma/2003/423 "Language Act"
[38]: https://www.espoo.fi/en/city-and-decision-making/research-and-statistics/population "Espoo end-2025 language statistics"
[39]: https://www.aalto.fi/en/news/helsinki-capital-region-research-collaboration-research-funding-for-impact-assessment-research-for "Capital-region research collaboration, 2024–2028"
[40]: https://github.com/exa-labs/exa-js "Official Exa JavaScript SDK"
[41]: https://www.espoo.fi/en/news/2024/12/city-espoo-and-aalto-university-signed-strategic-agreement-new-five-year-partnership-period "Espoo–Aalto strategic agreement"
[42]: https://www.espoo.fi/en/news/2026/04/educational-partnership-project-moving-forward-espoo-cooperation-between-guardians-and-schools-being "Educational Partnership, April 2026"
[43]: https://www.aalto.fi/fi/uutiset/finnish-ai-region-jatkaa-toiselle-kaudelle-eu-myonsi-huippupisteet "Aalto FAIR second-phase announcement"
[44]: https://www.aalto.fi/en/housing-design/sustainable-housing-in-kiviruukki-espoo-2026 "Kiviruukki Housing Design Studio 2026"

Additional participant result source: [Oskari Pessinen portfolio](https://www.oskaripessinen.com/) reports second place; this is self-reported and does not establish the winner or judge rationale.