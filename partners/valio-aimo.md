# Valio Aimo — Junction 2026 partner intelligence

Research cutoff: **7 October 2026**. Team: three full-stack developers plus Markus on data, evaluation, product and pitch. **Recommendation:** prepare a shortage-to-action workflow; choose the final problem only after seeing the challenge and data. Below, CONFIRMED means supported by a cited source; INFERENCE means a reasoned interpretation; SPECULATION means an unannounced possibility. Technical proposals are recommendations, not descriptions of Valio's internal systems.

## 1. What Valio Aimo does

**CONFIRMED:** Valio Aimo is Valio's foodservice wholesale business, combining Valio products with other manufacturers' products following the Heinon Tukku acquisition. Customers include cafés, restaurants and school kitchens. Delivery wholesale, Cash & Carry and manufacturer-direct ordering are distinct channels. [Company](https://www.valioaimo.fi/en/company/) · [Customer models](https://www.valioaimo.fi/en/become-a-customer/).

The relevant users are buyers, chefs, kitchen managers, customer-service staff and supply planners. A missing ingredient can disrupt a planned menu; a nominally similar substitute can change yield, cost or dietary suitability. Target a decision in this workflow rather than consumer dairy marketing.

## 2. Junction 2026 role

**CONFIRMED:** Junction's current site displays Valio Aimo among major partners; the event is 13–15 November at Hype Areena, Espoo. Tracks remain TBA. The supplied brief calls it a Challenge Partner, but the retrieved page does not explicitly attach that exact tier to Valio Aimo. No verified 2026 challenge owner, dataset, API, workshop, track prize or rubric was found. [Junction 2026](https://2026.hackjunction.com/).

**INFERENCE:** supply-chain reliability and digital customer experience are promising preparation themes. **SPECULATION:** shortage prediction, substitution or waste optimization will return. None is an announced challenge.

## 3. Junction 2025: strongest historical signal

**CONFIRMED:** Junction's challenge directory names **Zero-Fail Logistics**, in AI & Data, with €2,000/€1,500/€500 prizes. Valio's 17 November recap describes improving delivery reliability through AI and tackling product shortages before delivery reaches the customer. This is a verified scope summary, not the complete original challenge statement. [Challenge directory](https://www.hackjunction.com/challenges/) · [Official recap](https://www.valioaimo.fi/artikkelit/junction-hackaton-2025/).

| Place | Project / team | Evidence |
|---|---|---|
| 1 | Omni-Valio / NP Incomplete — Asadullah Nawaz Warraich, Nafay Rizwani | Official recap |
| 2 | Helmi / A to Z — Ayaan Jamil, Aleksi Alatalo, Hien Thao Vu, Aleksei Filonov | Official recap |
| 3 | Valio Aimo Zero-Fail / Kolmen Kopla — Aleksanteri Laitinen, Elli Mattila, Sauli Kinnunen | Official recap |

**Participant-reported:** the winner combined classical ML, multimodal models, vision, voice agents and deployment; the linked technical documentation could not be retrieved. A separate participant describes Logisti, reportedly fourth, combining historical-data shortage forecasting, replacements, voice notifications and AR fulfilment. These are firsthand descriptions, not independently validated performance. [Winner account](https://fi.linkedin.com/in/nafay-rizwani-62661721b) · [Logisti account](https://www.linkedin.com/posts/vikkash-sureshkumar_can-we-build-a-zero-fail-logistics-system-activity-7396601665560412160-Tr6H).

Hanna Forsström, identified in the recap as marketing & eCommerce director, emphasized practical kitchen understanding alongside AI and data. The complete data schema, prescribed outputs, constraints, scoring rubric, finalist architectures and post-event pilots remain unverified. **Lesson:** connect prediction to fulfilment and customer action; the winner's breadth does not prove that many agents caused its success.

## 4. Other innovation activity

Verified relevant activity includes customer-led digital-product development, forecasting-tool adoption and the 2026 Parhaat Pidot discussion of AI in kitchen administration. No additional directly relevant hackathon, university supply-chain project or startup programme was verified. The September 2026 AI article is an adoption signal, not evidence that Valio deployed every example discussed. [AI event coverage](https://www.valioaimo.fi/artikkelit/pinnalla-nyt/tekoaly-tuli-keittioon-nain-valjastat-sen-avuksesi/).

## 5. Current strategic priorities

| Priority / evidence | Already doing | Remaining difficulty — inference | Junction opportunity |
|---|---|---|---|
| Reliability: 2025 challenge | Seeking proactive shortage solutions | Act before intervention deadlines | Prioritized exceptions and feasible substitutes |
| Waste: September 2025 | Introducing forecast tools and demand planning; ambition to share updated forecasts with suppliers | Perishability versus service level | Expiry-aware replenishment |
| Digital productivity: January 2026 | Recipe import, costing and ordering | Uncertain demand and disruptions | Recommend changes when availability changes |
| Access: June 2026 | Unified login and broader Minun Aimo access | Permissions and cross-service integration | Pilot through exports before claiming live integration |

Sources: [Waste programme](https://www.valioaimo.fi/artikkelit/havikin-vahentaminen-on-yhdistelma-ennakointia-ja-saumatonta-yhteistyota/) · [Recipes](https://www.valioaimo.fi/artikkelit/reseptisi-ja-katelaskenta-minun-aimossa/) · [Login update](https://www.valioaimo.fi/asiakkaaksi/digipalveluihin-kirjautuminen/).

## 6. Minun Aimo: avoid redundant builds

**CONFIRMED:** purchase reports, carbon information, customer details, wholesale cards, recipes, information resources and customer service already exist. Recipes support sharing, portion changes, margin calculation and adding ingredients to the shopping cart. Contract-priced products are prioritized in recipe selection. [Digital tools](https://www.valioaimo.fi/en/company/why-choose-valio-aimo-as-a-partner/innovative-tools-for-everyday-work/) · [January 2026 update](https://www.valioaimo.fi/artikkelit/reseptisi-ja-katelaskenta-minun-aimossa/).

Build beyond these capabilities: explain how a shortage changes tomorrow's menu margin, propose a compliant replacement and show the decision's consequences. A generic report viewer or recipe-costing app overlaps substantially.

## 7. A.I.mo

**CONFIRMED:** public descriptions say A.I.mo helps find information such as purchase reports and online-store products, and assists with importing pasted recipe text. **Unverified:** model provider, architecture, complete data access, recommendation quality, autonomous procurement and numerical forecasting. [Digital tools](https://www.valioaimo.fi/en/company/why-choose-valio-aimo-as-a-partner/innovative-tools-for-everyday-work/) · [Recipe import](https://www.valioaimo.fi/artikkelit/reseptisi-ja-katelaskenta-minun-aimossa/).

The meaningful extension is a tested operational decision with explicit constraints, uncertainty and approval—not merely another conversational interface.

## 8. Supply-chain opportunity map

Conceptual map; not a verified Valio process diagram:

| Stage | Uncertainty / manual work | Suitable intervention |
|---|---|---|
| Demand → order | Attendance, menu, pack-size mismatch | Demand forecast; order rounding |
| Forecast → procurement | Supplier lead times, minimum quantities | Reorder policy; delay risk |
| Warehouse → picking | Expiry, stock discrepancies | FEFO allocation; exception detection |
| Availability → substitution | Dietary and cooking compatibility | Constraint filtering; ranking |
| Routing → delivery | Capacity, timing, failed fulfilment | Exception prioritization; notifications |
| Customer kitchen | Excess ingredients, disrupted menus | Menu repair; expiry-aware usage |

## 9. Forecasting: best 48-hour trade-off

Start with same-weekday demand, shifted rolling averages and a stock-versus-committed-orders rule. Test ETS for clean regular series; logistic regression for shortages; gradient boosting for sufficiently rich tabular data. Add lagged demand, recent shortage history, calendar and known-at-cutoff inventory. Predict at the actual intervention horizon.

Random forests are an optional comparator. ARIMA tuning and neural models are lower priorities unless the data clearly justify them. Quantile forecasts can express uncertainty; anomaly detection helps triage but is not automatically a shortage predictor. Choose the simplest approach that beats the baseline on later dates and improves the action metric.

## 10. Optimization opportunities

Recommendations; [OR-Tools](https://developers.google.com/optimization/assignment/assignment_cp) supports capacity-constrained assignment formulations.

| Area | Decision / objective | Constraints / algorithm | 48h feasibility |
|---|---|---|---|
| Substitution | Assign alternatives; minimize unmet demand and cost | Allergens, inventory, pack units; greedy then assignment/MIP | High |
| Inventory | Order quantity; balance shortages and waste | Lead time, MOQ, shelf life; quantile policy/simulation | Medium |
| Menu repair | Ingredient/portion choices; preserve margin | Diet, yield, budget; LP/MIP | Medium |
| Expiry allocation | Lots to orders; reduce write-offs | Usable shelf life; FEFO heuristic | High with lot data |
| Routing/batching | Stops/pick groups; reduce time | Windows, capacity, map; heuristics | Medium; data-intensive |
| Procurement/assortment | Suppliers/SKUs; minimize total cost | Contracts, MOQ, supply; MIP | Medium-low |

## 11. Substitution architecture

`unavailable SKU → category/embedding candidates → hard filters → inventory-aware ranking → explanation → approval`

Hard filters require trusted allergen/dietary data, contract restrictions, usable shelf life and unit conversions. Unknown safety-critical attributes cause abstention. Rank remaining candidates by cooking suitability, effective price, preference and availability; allocate jointly when orders compete for stock. Embeddings retrieve candidates; learning-to-rank needs acceptance labels. LLMs can explain validated choices, but must not invent allergens, available stock or suitability.

## 12. Food waste

**CONFIRMED:** Valio Aimo targets halving wholesale food waste by 2030 against 2024. Measures include forecasting, order-delivery optimization, offers on near-expiry stock and food-aid partners. [September 2025 statement](https://www.valioaimo.fi/artikkelit/havikin-vahentaminen-on-yhdistelma-ennakointia-ja-saumatonta-yhteistyota/).

Separate warehouse expiry, transport damage and kitchen overproduction; they need different data. Measure discarded kg, write-off euros, near-expiry sell-through and waste per served portion, while tracking fill rate to prevent apparent improvements caused by understocking. Redistribution and discounting already exist; optimize timing and eligibility rather than inventing a new listing page.

## 13. Carbon data

**CONFIRMED:** Minun Aimo reports purchase emissions mainly using category estimates; Valio milk-based products are an exception with product-level values. Sources include Luke, Big Climate Database v1.2 and Valio calculations, with Excel export available. [May 2025 methodology](https://www.valioaimo.fi/artikkelit/pinnalla-nyt/elintarvikeostojen-hiilijalanjalkitiedot-minun-aimossa/).

Optimize cost × availability × impact × quality only with comparable units, boundaries and disclosed data granularity. Same-category alternatives may have no defensible carbon distinction. Show feasible trade-offs rather than claiming precise SKU savings from category averages.

## 14. External signals

Proposed sources; API access and licensing need checking once the challenge is known.

| Signal / source | Target and causal link | Add in 48h? |
|---|---|---|
| Holidays / official calendar | Demand changes from closures | Yes if history spans holidays |
| School calendars / municipality | Institutional meals track attendance | Yes for relevant customers |
| Weather / Finnish Meteorological Institute | Terrace traffic, seasonal categories | Only with location and archived forecasts |
| Events / city listings or Exa retrieval | Local footfall changes | Only with geography and advance publication times |
| Traffic / Fintraffic | Delivery delays | Only with routing data |
| Supplier news / Exa | Disruption risks | Usually a triage feature, not a validated forecast |
| Tourism, trends, commodity prices | Slower demand/cost shifts | Usually defer |

Historical realized weather is not a substitute for the forecast available at prediction time. Test incremental value before adding signals.

## 15. Likely datasets — SPECULATIVE

| Table | Target / features | Leakage and preprocessing |
|---|---|---|
| Order lines | Short fulfilment; SKU, quantity, due date | Separate ordered, shipped and cancelled quantities |
| Inventory snapshots | Depletion; stock, commitments | Require timestamped snapshots; today's stock leaks |
| Supplier receipts | Late inbound; lead times | Actual arrival belongs to labels, not prior features |
| Product catalogue | Substitute eligibility | Normalize units; distinguish unknown from false |
| Substitution logs | Acceptance; alternative, customer | Rejections may be missing; selected-only bias |
| Lots/waste | Expiry loss; age, quantity | Require lot-level links and disposal reasons |
| Delivery/customer | Timing, segment, location | Final outcome leaks; IDs may encode memorization |

No public participant API or confirmed 2026 schema was located.

## 16. Data-science traps

Use date-based holdouts and rolling backtests; group all rows from the same date/order consistently. Shift aggregates and fit preprocessing only on training data. Define the prediction timestamp before choosing features. Report rare-event precision/recall and alert volume, plus cold-start SKU/customer slices. Distinguish stockout-censored sales from demand; handle assortment changes, promotions, missing snapshots and pack conversions explicitly. [Time-series validation guidance](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html).

## 17. Metrics that matter

Demand: MAE and WAPE, with denominators checked; MAPE is problematic around zero. Shortages: PR-AUC, precision/recall at a fixed intervention budget and calibration. Business: line fill rate, shortage units, accepted substitutes, operator minutes, waste and intervention cost. On-time delivery is distinct from complete delivery.

Illustration, **not a Valio estimate**: among 100 actual shortages, recall rising from 50% to 60% detects 10 extra cases. If five can be corrected, five shortage cases are avoided—not necessarily five failed deliveries. False alerts and action costs still matter.

## 18. Prediction → decision

`forecast → calibrated risk → feasible actions → ranking/allocation → explanation → operator approval`

Examples: reserve alternative stock; request earlier replenishment; notify a buyer before cutoff; repair a recipe; prioritize an expiring lot. A prediction has value only while an available action can change the outcome.

## 19. Classical methods versus LLMs

Use analytics for quantities, probability and inventory balances; optimization/rules for resource allocation and constraints. Use LLMs for metadata extraction with validation, grounded exception summaries, buyer messages and explanations. Natural-language analytics should call controlled queries. Food-safety eligibility remains structured and validated.

## 20. What would impress judges?

**INFERENCE:** a logistics manager needs fewer preventable shortages; customer service needs fewer calls; a product owner needs a usable workflow; sustainability needs measured waste; engineering needs reproducible evaluation and integration boundaries. Demonstrate one actionable case, baseline comparison, rejection handling and audit history. Generic chat, a decorative dashboard or complex ML without a baseline is weak. A Monday pilot needs a narrowly defined user, export/import route, approval gate and measurable test plan.

## 21. Baseline-first strategy

Define the business metric, build a simple rule, validate on later dates, attach an action, connect the UI and measure improvement. Set a modeling timebox: after two credible comparisons, stop unless failures prevent useful decisions. Prefer a reliable baseline and working product over marginal score gains.

## 22. Six adaptable project seeds

All seeds are SPECULATIVE and depend on supplied data.

| Seed / user | Data and model | Action / MVP / live demo | Metric / main risk |
|---|---|---|---|
| Shortage Rescue / service agent | Orders, snapshots; rule + classifier | Queue with substitute approval; inject a shortage | Resolved lines / missing cutoff snapshots |
| Safe Substitute / buyer | Catalogue, inventory; filters + ranking | Three eligible alternatives; reject allergen conflict | Acceptance / incomplete metadata |
| Expiry Allocation / planner | Lots, orders; FEFO + assignment | Reallocate lots; compare baseline waste | Waste kg + fill rate / missing lot history |
| Replenishment Sandbox / purchaser | Demand, lead times; quantiles | Order recommendations; change service target | Simulated cost / unobserved demand |
| Menu Repair / chef | Recipes, prices, diets; rules/MIP | Replace ingredient; update yield and margin | Feasible menu cost / existing-tool overlap |
| Exception Desk / operations lead | Orders, inbound, deadlines; risk ranking | Prioritize scarce operator attention | Prevented failures per hour / action labels |

## 23. Cross-partner combinations

These are architectural pairings, **not verified 2026 access, credits or prizes**.

| Combination | Concrete contribution / condition |
|---|---|
| Exa | Retrieve timestamped supplier/event evidence; valuable only if actionable |
| OpenAI or Google DeepMind | Grounded summaries and validated catalogue extraction; choose one provider |
| AfterQuery | Evaluation cases for invalid substitutions and unsupported claims, if its offering supports this |
| City of Espoo + Aalto | Local calendar/context and domain validation, if relevant datasets/mentors exist |
| Arduino | Temperature/event sensor demonstrator, only for a physical-chain challenge |
| Modal or Verda | Hosted scoring/inference when local compute is insufficient; avoid gratuitous GPU work |
| Hostinger | Accessible demo deployment if runtime supports the stack |

Cala AI's contribution needs clarification before selection. NVIDIA is justified by actual vision/compute needs; Featherless by a required supported open model; Cloudinary by a real image workflow. None is necessary for a tabular forecasting MVP.

## 24. Honest simulation

Use historical replay for intervention timing; Monte Carlo for demand/lead-time scenarios; compare greedy versus joint substitute allocation under fixed stock. Separate observed predictions from assumed acceptance, costs and preventability. Report sensitivity ranges and use identical scenarios for both policies. Simulation demonstrates policy behavior; it does not establish realized savings.

## 25. Preparation before Junction

**Definitely:** pandas, SQL, shifted features, date-based validation, one baseline and one classifier, deterministic substitution rules, a small API contract. Markus can own leakage checks and business evaluation; that uses his quantitative background directly.

**Worth preparing:** basic OR-Tools assignment, Plotly, structured model outputs, one deployable frontend/API skeleton. Choose pandas or Polars rather than learning both. Streamlit is useful for analysis; the three developers can build the final interface.

**Wait:** geospatial routing, deep learning, fine-tuning, real integrations and external-signal pipelines. Smallest useful set: temporal evaluation + shortage baseline + constrained action ranking + working demo.

## 26. A 3–5-hour practice exercise

Use [UCI Daily Demand Forecasting Orders](https://archive.ics.uci.edu/dataset/409/daily%2Bdemand%2Bforecasting%2Borders): 60 observations from a logistics company, CC BY 4.0. Verify chronological ordering from the downloaded data; if it cannot be established, choose a dated dataset rather than invent dates. The sample is for pipeline practice, not strong model evidence.

1. **0–1h:** audit chronology and features; exclude same-day order components that are unknown at forecasting time or sum toward the target.
2. **1–2h:** reserve later observations; compare lag/rolling baseline with weekday-plus-lag regression.
3. **2–3h:** choose daily processing capacity using asymmetric under/over-capacity costs; evaluate a fixed-capacity baseline.
4. **3–5h:** show demand, forecast, recommended capacity and simulated cost in one interface. Vary cost assumptions visibly. Do not imply this dataset contains food shortages or expiry outcomes.

## 27. Implementation lanes and timing

Developer 1: ingestion/model service; developer 2: API/action logic; developer 3: frontend/deployment. Markus: problem definition, mentor questions, validation, impact assumptions and pitch; collaborate on model selection.

| Hours | Deliverable |
|---|---|
| 0–3 | Confirm user, action cutoff, labels, rubric and data permissions |
| 3–8 | Data audit, baseline, shared API contract, first complete demo |
| 8–18 | One candidate model; validated constraints; error slices |
| 18–30 | Business comparison, approval flow, operational feedback |
| 30–40 | Freeze features, polish pitch, rehearse, record fallback |
| Final hours | Submit and verify artifacts; no architecture changes |

**Schedule caveat:** the published preliminary schedule places Friday opening at 18:00 and Sunday submission at 10:00—about 40 hours. Treat the advertised 48 hours as an upper planning envelope and finish by the actual submission deadline. [Schedule](https://2026.hackjunction.com/).

## 28. Risks and launch questions

Poor data: timebox cleaning and narrow scope. Too few shortages: use transparent rules and disclose uncertainty. Wrong problem: ask the mentor which decision can still change. Unavailable integration: use exports with an explicit adapter boundary. Model overfitting: retain untouched later data. Hallucination/allergens: validate and abstain. Weak demo: preserve deterministic scenarios and a recording. Unrealistic savings: separate replay evidence from assumed causal benefit.

Ask first: **When must we predict? What action is permitted? What data existed then? What is the cost of a false alert? Which acceptance/food-safety rules are mandatory? What will judges score?**

## 29. Final cheat sheet

| Item | Answer |
|---|---|
| Partner / core business | Valio Aimo / B2B foodservice wholesale |
| Junction role | 2026 partner displayed; exact challenge designation/details unverified |
| 2025 lesson | Prevent shortages before customer delivery; close the action loop |
| Likely 2026 themes | Reliability, substitutions, waste—SPECULATION |
| Useful data | Timestamped orders, stock, catalogue, inbound and outcomes |
| Modeling / optimization | Temporal baseline + tabular model / constrained allocation |
| Business metric | Correctable shortage lines prevented at bounded action cost |
| AI use / combination | Grounded explanations / one model provider; Exa only for useful external evidence |
| Impress / bore | Reproducible operational decisions / generic food chatbot |
| Preparation / trap | Temporal validation and substitution rules / future-information leakage |
| Biggest uncertainty | 2026 problem, actionable data and judging criteria |
| Relevance / confidence | **9/10** for team fit; **7/10** on business context, **2/10** on 2026 challenge specifics—subjective ratings |

### Five things our team should remember

1. Build an action before spending hours improving a forecast.
2. A.I.mo, recipes, costing and carbon reporting already exist.
3. Prediction timestamps determine which features are legitimate.
4. Reject unsafe substitutes even when they score highly.
5. Prove baseline-relative impact and label every simulated assumption.
