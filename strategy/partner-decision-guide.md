# Partner decision guide — 24 October 2026

This is our synthesis for **three full-stack developers plus Markus on research, architecture, evaluation and pitch**. It combines the existing reports with the new coverage. Ratings are team-specific judgements, not partner scoring criteria. Current roles are independently checked; older technical claims retain the dates of their source reports.

## Where to focus

**First conversations:** S-Pankki, Bahn Express, Stoa, Valio Aimo and City of Espoo, if their released briefs match our strengths. They offer plausible concrete workflows where data, business reasoning and a good interface can combine. AfterQuery is attractive if the actual problem concerns reliable professional tasks and evaluation. These are preparation priorities, not a prediction of the best challenge.

**Default build shape:** one web interface, one backend, one database, one primary model provider where needed and a small evaluation set. Add retrieval, media or custom compute only if the user task needs it.

**Hardware branch:** Arduino/Atech, Intel/NVIDIA, Qualia, Scailab, Rokoko and Wendy become attractive when a working kit/example is available. Access and calibration are part of the decision, not details to solve after committing.

## Capability and access matrix

| Partner | Useful capability/domain | First verification | Preparation priority |
|---|---|---|---|
| [Arduino](../partners/arduino.md) | Physical inputs and actuation | Working loan kit and supported sample | Hardware demonstration conditional |
| [Verda](../partners/verda.md) | Custom CPU/GPU compute | Quota, budget and reproducible deployment | Learn one deployment |
| [Hostinger](../partners/hostinger.md) | Application creation/hosting | Required product and deploy path | Use if challenge fit |
| [Valio Aimo](../partners/valio-aimo.md) | Foodservice operations | Realistic orders/stock and task definition | Early challenge conversation |
| [S-Pankki](../partners/s-pankki.md) | Banking workflows | Permitted data and defined decision | Early challenge conversation |
| [Aalto University](../partners/aalto-university.md) | Research-led challenge | Actual department/owner and brief | Keep scope open |
| [Cala](../partners/cala-ai.md) | Structured entity evidence | Coverage on actual target entities | Short data probe |
| [City of Espoo](../partners/city-of-espoo.md) | Public-service/urban workflows | Specific user and usable data | Early challenge conversation |
| [Exa](../partners/exa-ai.md) | Web discovery and evidence | Relevant sourced results on fixed questions | Learn one retrieval path |
| [MariaDB](../partners/mariadb.md) | Relational and vector retrieval | Supported version and meaningful constraints | Small SQL/vector exercise |
| [AfterQuery](../partners/afterquery.md) | Expert tasks and evaluation | Task environment and scoring expectations | Prepare evaluation discipline |
| [Bahn Express](../partners/bahn-express.md) | Vehicle-transfer operations | Scheduling constraints and sample orders | Early challenge conversation |
| [AstraZeneca](../partners/astrazeneca.md) | Research/health workflows | Allowed corpus and credible evaluation | Conditional on data |
| [Stoa](../partners/stoa.md) | Construction project evidence | Document revisions and user task | Early challenge conversation |
| [Intel](../partners/intel.md) | Local/optimized inference | Exact device and working runtime | Conditional hardware exercise |
| [Context.dev](../partners/context-dev.md) | Web extraction and monitoring | Source quality and API access | Compare with Exa/Oxylabs |
| [Rokoko](../partners/rokoko.md) | Motion capture workflows | Capture/export path and rights | Conditional media exercise |
| [Ignite Next](../partners/ignite-next.md) | Deep-tech challenge framing | Actual technical brief | Prepare evidence-to-value pitch |
| [OpenAI Codex](../partners/openai-codex.md) | Coding and review workflow | Team access and reproducible checks | Practice bounded tasks |
| [NVIDIA](../partners/nvidia.md) | Inference and physical-AI tooling | Exact tool/model/hardware access | Choose one relevant tool |
| [Featherless](../partners/featherless.md) | Hosted open-model inference | Chosen model passes acceptance cases | Short inference probe |
| [Modal](../partners/modal.md) | Custom serverless compute | Working function and budget | Learn one deployment |
| [Qualia](../partners/qualia.md) | Robot learning/task expertise | Supplied baseline/data/hardware | Mentor-led only |
| [CRACI](../partners/craci.md) | Build and release provenance | Runner permissions and usable evidence | Use if setup is quick |
| [Atech.dev](../partners/atech.md) | Modular physical interfaces | Available modules and working bridge | Conditional hardware exercise |
| [Scailab](../partners/scailab.md) | Perception/synthetic-data domain | Actual accessible technical package | Do not assume readiness |
| [IronShard](../partners/ironshard.md) | Object storage for artifacts | Documented available operations | Use if storage is needed |
| [Cloudinary](../partners/cloudinary.md) | Media ingestion and delivery | Required transformations/export rights | Learn if media is central |
| [Wendy](../partners/wendy.md) | Device deployment and telemetry | Supported target and working sample | Conditional device exercise |
| [Aiven](../partners/aiven.md) | Managed application data | Service/network access and cost controls | Simple database fallback |
| [Oxylabs](../partners/oxylabs.md) | Public-web data acquisition | Permitted source set and tested request | Compare with Context/Exa |
| [Google DeepMind](../partners/google-deepmind.md) | Google model ecosystem | Current endpoint and account access | Verify exact capability |

Supporters are covered in the [separate brief](../partners/supporters.md). Use them for a few targeted feedback/support conversations; do not treat them as guaranteed APIs or challenge tracks.

## Select a challenge from evidence

Suggested scoring rubric, to apply after the real briefs arrive:

| Criterion | Weight | Evidence to request |
|---|---:|---|
| User problem and observable value | 25% | Who uses it and what decision changes |
| Data/tool access now | 25% | A successful sample request or usable fixture |
| Working demo within the weekend | 20% | Narrow vertical slice and dependencies |
| Team advantage | 15% | Relevant domain knowledge and familiar implementation |
| Evaluation and differentiation | 15% | Baseline, outcome metric and meaningful improvement |

Score each dimension 0–5 and calculate a weighted average. This is a discussion aid, not objective truth. **Hard gate:** no critical dependency without access; no core scientific claim without a feasible evaluation. Do not let a high average compensate for an impossible dependency.

## Five candidate directions to discuss

| Hypothesis | Primary problem partner | Minimal technical composition | Evidence to show |
|---|---|---|---|
| Explainable household cash-flow scenarios | S-Pankki | Permitted data + calculations + review UI | Correct amounts, uncertainty and useful action |
| Disruption recovery for vehicle transfer | Bahn Express | Order fixture + scheduling baseline + dispatch UI | Feasibility, late/unserved jobs and replanning |
| Revision-aware construction information | Stoa | Versioned documents + retrieval + citations | Reject an obsolete instruction |
| Foodservice shortage/substitution decision | Valio Aimo | Supplied inventory/orders + rules/optimization | Availability and constraints, not similarity alone |
| Evidence-backed public-service guidance | City of Espoo | Approved information + retrieval + review | Supported answers and appropriate abstention |

These are not announced challenges. Exact partner combinations and multi-track entry must be confirmed. For each direction, choose the simplest adequate data/model provider from the matrix.

## Practical opening workflow

1. Read the real brief and identify the user, output, scoring criteria and mandatory integrations.
2. Markus speaks to the relevant mentor while developers probe the highest-risk dependency.
3. Create a few evaluation cases, including a failure or unknown case, before prompt tuning.
4. Choose one challenge and one vertical slice. Keep a written fallback if access fails.
5. Get real input through the whole app on the first evening; defer cosmetic breadth.
6. Demonstrate improvements against a fixed baseline and preserve failures honestly.

The event schedule currently places opening at Friday 18:00 and final submissions at Sunday 10:00. Treat that as roughly **40 hours between those milestones**, not 48 engineering hours per person. Rest, setup, workshops and submission preparation reduce usable time. The schedule is preliminary; confirm the participant instructions. [Official schedule](https://2026.hackjunction.com/#schedule)

## Shared readiness checklist

- [ ] Actual challenge and judging rubric recorded.
- [ ] Data licence and publication conditions checked.
- [ ] One successful real request/sample on each critical dependency.
- [ ] Keys kept server-side; no credentials in fixtures or screenshots.
- [ ] Exact model/runtime/database versions recorded.
- [ ] Fixed evaluation cases and a simple baseline.
- [ ] Cost/quota owner and shutdown plan.
- [ ] Demo can explain an unavailable or uncertain result.
- [ ] Cached, synthetic and simulated outputs labelled.
- [ ] Pre-event material disclosed as required; actual submission built under event rules.
- [ ] Pitch distinguishes what works now from a future pilot.

## Remaining event-level unknowns

The [official event page](https://2026.hackjunction.com/) still says tracks are TBA. No full partner-specific package of prizes, credentials, datasets and judging criteria was verified in this pass. A published product capability is not an event entitlement. Recheck the roster and participant portal when briefs are released.
