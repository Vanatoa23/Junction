# SecondSource: 30-day supplier delivery risk (reference v1)

Decision: use a residual hazard model plus cause-aware noisy-OR. This is a proposed probability estimator, **not yet empirically calibrated**. Keep the current map's 0–100 heuristic separate until shadow evaluation passes. Reference code: `packages/checks/src/risk30.ts`; tests: `packages/checks/src/risk30.test.ts`. No database, network, clock reads, randomness or LLM calls occur in scoring.

## Meaning and buyer experience

`riskFactor` estimates P(at least one delivery due in the next 30 days misses its promised date), conditional on an active supply relationship with scheduled deliveries. No scheduled deliveries means “not applicable”; filter those relationships before scoring. Define a missed promise consistently in training labels; don't mix supplier bankruptcy with delivery failure. Scope a score to the buyer's part/facility relationship; aggregate multiple relationships only with an explicit model of their dependence.

Show “Delivery risk in the next 30 days: 34% (model estimate)”, a green/yellow/red status, confidence and linked reasons. Green = no current warning detected, yellow = investigate/prepare, red = act now. Confidence and unknown-data warnings stay visible, including on green cards. Scenario ranges are sensitivity bounds, not statistical confidence intervals. Do not present 34.3% as precision justified by sparse data.

## Inputs and deterministic formula

Cala supplies canonical suppliers, sites, ports, routes and consumer→dependency edges. Use tier 2/3 and logistics nodes; deeper material dependencies may also be included. An edge's transmission `w ∈ [0,1]` means the probability a failure there prevents an on-time delivery here. Start from physical dependency share, then adjust using verified buffer days, recovery time, rerouting and operational substitution. Spend share alone is unsafe: a cheap indispensable component can have w=1. Ready buyer alternatives affect urgency, not the supplier's probability of delivering. Multi-site production affects transmission; “two sites” alone does not imply redundancy when both share a port.

Each numeric input has low/estimate/high scenarios and evidence. Country, financial health, sanctions exposure and past disruptions inform **residual annual delivery-failure hazards** λ. Fit a joint hazard model (e.g. log λ = intercept + country + financial + history covariates) offline, then export its predicted hazard and factor explanations as a single baseline component. If supplying separate additive components, they must represent disjoint residual causes. Do not add independent multipliers for overlapping country/region or financial/bankruptcy signals. Model a regional baseline as a shared region/route node if it affects several branches. Site concentration and chokepoints primarily enter the graph rather than a second arbitrary concentration bonus. Sanctions already active are persistent live causes, not just a country penalty.

For target s, set exposure x(s)=1. In consumer-first topological order:

```
x(v) = min(1, Σ over incoming consumer edges u→v of x(u) w(u,v))
B_j = x(node_j) [1 − exp(−λ_j · 30/365)]
d_e(t) = 2^(−ageDays / halfLifeDays), or 1 for persistent causes
a_e = credibility · extractionConfidence · (rumor ? 0.35 : 1) · d_e(t)
q_e = x(eventNode) · a_e · P(delivery miss within horizon | event)
Q_c = max(q_e for matches/reports belonging to physical cause c)
H = Σ_j −log(1−B_j) + Σ_c −log(1−Q_c)
P30 = 1−exp(−H)
```

The sum of paths is a capped union-bound approximation for delivery exposure. It is exact for mutually exclusive affected production shares; it can overestimate overlapping paths. Never noisy-OR the same port independently through two upstream suppliers. Conversely, the max across multiple location matches of one cause is conservative against duplicate inflation but can underestimate a wide regional event. Prefer one canonical shared event node connected to every affected branch; this aggregates shares before applying the cause once. Correlated events (strike plus resulting closure) must share a cause ID. Distinct causes are assumed independent conditional on graph/baseline covariates. Confidence ranges do not remove this structural assumption.

Residual baseline excludes the **incremental** exposure of observed active events: otherwise the same incident is counted twice. Annual rates of event arrival are not delivery-failure rates. For region r and event type k, a starting hazard is `λ_rk = annualArrivalRate_rk × P(delivery miss | event r,k)` under a rare independent-event approximation; model overlap and seasonality during fitting. Set half-lives and conditional failure from history by event type, duration, lead time and inventory. No universal numeric half-life is asserted here. The tests' seven days and worked example are synthetic assumptions.

An event's conditional failure is a rolling 30-day quantity; refresh it as duration, inventory and recovery change. Duration is already inside this conditional estimate; don't multiply it in again. Confirmed fire/closure warnings decay without reconfirmation; persistent sanctions and bankruptcy remain until explicit resolution/review. Expired stale warnings need scheduled recomputation even when no new article arrives. Resolution removes the event's contribution; a correction can reduce risk. Corroboration replaces the canonical support estimate; syndicated copies don't increase it.

## Evidence and unknowns

Context.dev/Exa retrieve evidence; an LLM extracts event type, entity, location, occurrence/review time, estimated duration, quoted text and extraction confidence. An ingestion validator checks source URLs, quote substrings, timestamps, entity/location matches and cause identity. Source credibility comes from an audited source registry, independent of the LLM's confidence. A versioned deterministic adapter maps those facts plus operations data to conditional failure scenarios. Confidence multiplication is a provisional reliability discount, not a Bayesian posterior. Fit it against labeled claims later. The module requires structured, linked inputs; it does not implement extraction or evidence verification.

Every baseline and live contribution has a readable reason and source links, including graph edges. Each reason's `hazard` adds exactly to total H, enabling a reproducible score audit without misleading additive percentage points. Buyer urgency reasons have zero hazard. Internal model/prior policy URLs are valid evidence for assumptions; label them “model assumption”, not news. Frontends should turn raw inputs into concrete sentences, e.g. “60% of this supplier's output depends on Tier2Co; 80% of that supply uses the closed port.”

Missing data adds a separate residual prior proportional to uncovered baseline; if no baseline is present use the full prior. Default annual hazard scenarios are [0, .25, 1], corresponding to approximately [0%, 2.0%, 7.9%] over 30 days at full exposure. These are **illustrative**, replaceable cohort priors, not evidence that unknown suppliers are safe. Unknown dependencies require placeholder nodes/edges with broad ranges from the adapter, not omission. An explicitly investigated empty graph differs from “not yet researched”. Coverage must reflect missing branches and freshness of country, finances, sites, history and graph edges; never set it to 1 merely because one record exists.

Confidence score = minimum reachable nonzero-exposure node coverage, material live-source support, and buyer-data coverage, multiplied by `1 − (P_high−P_low)`. Buyer unknown caps coverage at .5; no baseline forces zero confidence. Labels: low <.5, medium <.8, high otherwise. This is an evidence-completeness indicator, not P(the estimate is correct). It is deliberately conservative; a weak upstream report can lower it substantially. Source discount uncertainty should also be reflected in event scenario inputs. Inputs with impossible ranges, missing evidence, duplicate IDs/edges, future observations, NaN or cyclic dependencies fail explicitly rather than quietly returning green.

## Probability versus urgency

Let impact `I = criticality × (.5 + .5/(1 + readyAlternatives))`. Criticality is a normalized business-loss scale; approved alternatives count only if qualified and ready within 30 days. Unknown buyer data uses I=.75 with a warning. Alternatives reduce disruption impact but cannot erase switching costs; this assumption must be fitted with users. `expectedLoss = P30 × I` is normalized expected loss, not money.

Ordered rules (red wins):

* Red if P30 >40%, P30×I >20%, or a confirmed cause's discounted delivery exposure is ≥25% with I≥50%.
* Yellow if P30 >15%, P30×I >7.5%, or any reachable active live signal has positive delivery exposure.
* Otherwise green, with confidence shown separately. “Confirmed somewhere in the world” cannot make every supplier red.

15% and 40% are initial decision cutoffs, not validated calibration. For I=.5, expected-loss cutoffs reproduce those probability thresholds; for critical suppliers they trigger sooner. If a mitigation costs C and avoids loss L when a delivery fails, the decision boundary is approximately P>C/L. The chosen starting boundaries imply ratios .15 and .40 for preparation and intervention. Establish real costs and benefits with buyers. The confirmed-cause override provides an action rule before the estimator is well fitted, but requires material exposure; a minor confirmed strike stays yellow. Any live hit stays at least yellow in v1, even below 15%; add a validated expiry/de minimis rule if this creates alert fatigue.

## Worked example: tier-2 port closure

Synthetic supplier S has residual annual failure hazard .12, giving baseline P=.009815. S depends 60% on Tier2Co, whose delivery exposure to port P is .8. Thus port exposure is .48. A fresh confirmed closure has credibility .95, extraction confidence .9 and conditional delivery failure .8. Its incremental Q=.48×.95×.9×.8=.32832. Tier2Co/port residual hazards are zero for this isolated demonstration (explicit investigated zero, not unknown).

P30 = 1−exp(−.12×30/365)×(1−.32832) ≈ **33.49%**. With criticality .8 and no ready alternatives, I=.8 and expected loss≈.2679. Status is **red** both for expected loss >.20 and material confirmed exposure ≥.25. Buyer lines link the closure article, Tier2Co relationship, port route and baseline assumptions. A half-life later without reconfirmation Q=.16416 and P30≈17.24%, producing yellow. A ready-alternative change can alter urgency without altering P30. A second upstream branch sharing this same port increases exposure, rather than introducing a second independent port closure.

## Calibration and release gate

1. Define labels per supplier/part/horizon from promised-versus-actual delivery records, including failures with no detected news. Snapshot predictions, graph, missingness, evidence and policy versions before outcomes. Use full 30-day follow-up or survival methods for censored windows. Avoid treating repeated overlapping daily windows as independent observations.
2. In SupplyGym, load the simulator's actual five-region annual rates for strike, port_closure, fire, sanction and bankruptcy. No simulator rates were supplied in this task or found in the current module; do not invent them. Generate held-out supplier graphs, event arrivals/durations, shared hubs, buffers and delivery outcomes; inject detection delay, rumors, missing branches and duplicate news. Train event-to-delivery and residual hazards on training episodes. Split by time AND graph/episode to avoid leaking a shared disruption between train and test.
3. Measure Brier score, log loss (clip only for numerical evaluation), reliability curves and calibration error by region, type, probability band and missingness. Compare to cohort-rate and current heuristic baselines. Use bootstrap intervals clustered by disruption/episode. Simulator correctness is not real-world calibration.
4. Fit hazards/conditional probabilities first; fit a monotone probability calibrator on a separate validation set if necessary. The reference module intentionally has no fitted calibrator. Recheck calibration after fitting; a production calibrator must preserve linked raw contributions and show the separate calibration adjustment, version and provenance.
5. Tune yellow/red rules against missed disruptions, precision, lead time, false alerts per supplier-month and buyer mitigation costs. Evaluate the confirmed override separately. Choose thresholds on validation data, freeze them and report performance on untouched test history. Shadow-test before exposing probabilities; then monitor drift monthly and refit with sufficient mature outcomes. Backtest persistent causes and stale warnings explicitly.

## Compute, integration and limitations

Compile and validate the DAG once after each Cala graph refresh. `affectedSuppliers` uses a reverse index to identify ancestors of changed event nodes; rescore only monitored supplier relationships among those IDs. It includes resolution/baseline changes. `scoreRisk30` takes an explicit timestamp for replay. Cache target exposure and provenance by graph version in a production service; retain per-cause hazard contributions so an event update subtracts old and adds new contributions. Recompute on aging ticks, buyer edits and graph changes as well as new events.

Reference topology and exposure work is O(V+E) per target; event scanning is O(M) and evidence copying can add O(V×E) work in dense graphs. It stores bounded unique evidence links rather than enumerating paths. For hundreds of suppliers and small tier-2/3 graphs this is practical; large feeds should use the cause→node index and cached exposures rather than scan every event. Runtime is independent of number of news articles after canonicalization. No exponential probabilistic inference or Monte Carlo is needed on an event update.

Cycles are rejected: ingestion must collapse strongly connected components into a documented joint node, or require manual review. v1 has no exact k-of-n production logic, no inventory simulation and no exact correlation inference. Dependency transmissions and event support are expert priors until calibrated. Conservative path sums, max cause matching and independent-cause noisy-OR have different error directions; do not call the entire estimate an upper bound. Sanctions require entity and legal-scope review before a confirmed delivery effect is assigned. The spec is an engineering model, not a sanctions determination.

| Approach | Strength | Cost / reason for decision |
| --- | --- | --- |
| Naive recursive noisy-OR | Simple, fast, easy to explain | Double-counts a shared port reached through two branches; cannot treat all parents as independent. |
| Bayesian network with explicit shared causes | Can represent conditional dependence and production logic precisely | Needs many conditional probability tables and adequate data; exact inference can grow rapidly with graph connectivity. A later option for key bottlenecks. |
| Residual hazard + cause-aware noisy-OR (chosen) | Coherent 30-day horizon, replayable aging, cause deduplication, additive hazard audit, cheap updates | Approximate exposure/correlation; needs empirical calibration. Good reference starting point with sparse evidence. |

Use `compileRiskGraph(graph)` then `scoreRisk30(compiled, supplierId, events, nowMs, buyer, policy)`. Treat compiled maps as immutable. Feed one current canonical state per cause/node (replace rumor on confirmation, remove old report on resolution); the scorer is not a chronological event reducer. Ingestion owns retrieval, deduplication, durable history and schema validation for untyped JSON. This deliverable does not replace the map scorer or change production UI/API behavior.
