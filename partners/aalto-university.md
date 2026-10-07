# Junction 2026 Partner Intelligence — Aalto University

**Research cutoff: 7 October 2026. Event: 13–15 November, Hype Areena, Espoo.**

**Recommendation:** prepare accessible voice interaction and measurable AI evaluation first; keep physical AI as an alternative. Aalto’s strongest direct precedent is an older-adult challenge, but its 2026 internal sponsor remains unidentified.

Labels: **CONFIRMED** = documented; **INFERENCE** = evidence-backed interpretation; **SPECULATION** = plausible prediction. Integration times below are planning estimates, not tested installation times.

## 1. Who is the partner?

**Challenge-partner status: confirmed in the partner listing supplied for this task.** The [current Junction website](https://2026.hackjunction.com/) still labels challenge tracks TBA. Its retrieved text does not independently expose Aalto’s partner-tier logo, so this report does not claim independent verification of that tier.

**CONFIRMED:** Aalto’s 2025 challenge belonged to **AR4U**, a School of Science Research to Business project. The challenge representatives were Timo Niskanen, Silas Rech and Gautam Vishwanath; the research portal names Juha Salmitaival as principal investigator. [2025 recap](https://www.aalto.fi/en/news/aalto-students-and-researchers-shape-together-how-we-age-with-ai-at-junction-hackathon-2025), [project affiliation](https://www.aalto.fi/en/innovation-portfolio/ar4u), [research record](https://research.aalto.fi/en/persons/silas-rech/).

**Unknown:** no located announcement connects AR4U, a professor, department or EU project to the November 2026 challenge. AR4U’s recorded R2B period ended **31 December 2025**; continuation cannot be assumed. Aaltoes, AaltoAI and Aalto Robotics Club are distinct ecosystem actors, not interchangeable challenge owners.

## 2. Why sponsor? Current signals

**INFERENCE:** Aalto can use Junction to test research commercialisation, discover use cases and observe prototypes built with researcher feedback.

Three current signals matter:

- **Accessible AI:** AR4U demonstrated a senior-focused voice assistant at [Spring Demo Day 2025](https://medialabdemoday.aalto.fi/2025-spring/ar4u/). Its [Finnish portfolio page](https://www.aalto.fi/fi/innovaatioportfolio/ar4u) describes smart-speaker/telephone interaction and senior testing. This suggests adoption and interaction quality could matter more than model novelty.
- **Applied industrial AI:** [House of AI’s August 2026 update](https://www.aalto.fi/en/news/ai-is-unlocking-new-possibilities-for-machines-and-manufacturing) reports growing manufacturing/autonomous-machine collaboration. A [2026 funded recruitment call](https://www.aalto.fi/en/open-positions/postdoctoral-positions-intelligent-robotics-house-of-ai) specifies imitation learning, manipulation, sparse-failure prediction and distribution shift. A useful build could benchmark reliability against a simple baseline.
- **Human-centred, explainable interfaces:** [Chartist and Typoist, April 2025](https://www.aalto.fi/en/news/ai-that-mirrors-how-humans-behave-can-drive-better-designs-for-keyboards-and-charts), model chart reading and typing errors; Typoist involved Google Gboard. These support accessibility/evaluation directions, without proving sponsorship.

[House of AI’s research agenda](https://www.aalto.fi/en/house-of-ai/research-at-the-house-of-ai), updated August 2026, also covers electricity forecasting/control and health. Energy is a reserve hypothesis. No sufficiently specific November link was found for quantum, 6G, materials or circular economy to justify preparing those stacks.

## 3. Previous Junction involvement

| Event | Verified evidence | Competitive implication |
|---|---|---|
| 2025 | **“Aging with AI”**: support adults 65+ with independence, health and social participation, with ethical awareness. AR4U owned it. Winner **ApprenticeCircle+**, by Tommin Teekkarit, matched seniors and younger adults for learning, using telephone profile creation. | The [recap](https://www.aalto.fi/en/news/aalto-students-and-researchers-shape-together-how-we-age-with-ai-at-junction-hackathon-2025) credits thoughtful implementation and connections beyond family; mentor conversations shaped the idea. |
| 2024 | [Junction’s own announcement](https://www.linkedin.com/posts/hackjunction_innovation-activity-7239881638891933698-ah0Z) confirms an Aalto challenge. | Its full statement, owner, data, winners and rubric were not recovered; do not infer a recurring theme. |
| 2017 | [Aalto/VTT/Tampere joint challenge](https://www.aalto.fi/fi/perustieteiden-korkeakoulu/hackathon-toi-uuden-it-sukupolven-ja-yritykset-yhteen): entertaining content from Helsinki electric-bus data. | Historical evidence that Aalto challenges can involve external datasets and joint ownership. |
| 2026 side events | [Junction x Aalto Defence](https://hackjunction.app/hackathons/defence-hackathon-2026); [PORT_2026](https://hackjunction.app/hackathons/port-2026), covering culture/media and equitable climate action. | Separate events show breadth, not the November track. |

The 2025 recap supplies the challenge’s substance, not a complete original rules page. No mandatory technology, released dataset, public winner repository or numerical judging rubric was verified.

## 4. Plausible November challenge directions

Probabilities describe relative preparation priority, not statistical forecasts; none is announced.

| Theme / probability / status | Why and evidence | What to build / likely requirements |
|---|---|---|
| Ageing, independence and social connection — **Medium, INFERENCE** | Direct 2025 precedent; AR4U prototype. Sponsor continuity unknown. | Voice onboarding or coordination workflow; speech, accessible UI, consent, human handoff and task-completion metrics. |
| Human–AI collaboration/accessibility — **Medium, SPECULATION** | Current Chartist/Typoist research; overlap with older-adult needs. | Interaction evaluator or adaptive interface; comparison tasks, error analysis and modest user testing. |
| Physical AI/reliable machines — **Low, SPECULATION** | 2026 industrial research plus Junction’s announced Arduino lab. | Sensor anomaly detection or bounded robot task; replay/simulation, latency and failure measurements. |
| Energy forecasting/control — **Low, SPECULATION** | Explicit House of AI grid theme, without Junction linkage. | Demand forecast or load scheduler; time series, time-based validation, constraints and cost baseline. |

## 5. Useful technical resources

| Resource / official link | What it does / potential use | Integration difficulty |
|---|---|---|
| [Finnish wav2vec2 Base, fine-tuned](https://huggingface.co/GetmanY1/wav2vec2-base-fi-150k-finetuned) | Aalto-associated Finnish ASR, approximately 94M parameters, Apache-2.0; Transformers examples. Local voice baseline; requires 16 kHz audio. | **1 hour** for a file; several hours for streaming. No hosted inference provider shown. |
| [Aalto speech research code](https://github.com/aalto-speech/large-scale-monolingual-speech-foundation-models) | 2025 paper, weights and training scripts; inspect preprocessing and compare model sizes. | **15 min** to inspect; **risky** to train. Scripts target LUMI-scale workloads. |
| [Aalto Acoustics Lab datasets](https://github.com/AaltoAcousticsLab/aalto-datasets) | Room impulse responses and other audio datasets; use a small sample to stress-test speech under reverberation. | **1 hour** after checking the individual dataset’s size/licence. |
| [REACT](https://github.com/aalto-intelligent-robotics/REACT) | Updates/matches 3D scene graphs; supplied recorded scenes can support a changed-object demo. | **Risky**: Docker, Ubuntu 20.04/ROS Noetic, GPU and multiple dependencies; active-development warning. |

No public AR4U API, senior conversation corpus, Aalto compute allocation or lab access for November participants was verified. The [Arduino Hardware Lab](https://2026.hackjunction.com/) is an event resource, not Aalto infrastructure; it advertises UNO Q boards and LeRobot arms, without guaranteeing individual availability.

## 6. Groups and initiatives worth knowing

These are leads, not a predicted judging panel.

| Group / field / link | Current relevant work | Why care |
|---|---|---|
| [AR4U](https://www.aalto.fi/en/innovation-portfolio/ar4u) — ageing/voice AI | Senior-oriented assistant and research commercialisation. | Only identified recent Aalto main-event challenge owner. |
| [Aalto Speech Research](https://github.com/aalto-speech) — speech/language | Finnish foundation models and 2025–2026 speech-assessment code. | Practical local-language tooling; inspect licences individually. |
| [Oulasvirta’s HCI research](https://www.aalto.fi/en/news/ai-that-mirrors-how-humans-behave-can-drive-better-designs-for-keyboards-and-charts) — computational interaction | Chartist/Typoist, explainable behaviour modelling. | Helps frame measurable accessibility claims. |
| [Intelligent Robotics](https://irobotics.aalto.fi/) — robotics/vision/learning | Manipulation and reliable autonomy; 2026 industrial collaboration. | Strong alternative if physical AI is announced. |
| [House of AI](https://www.aalto.fi/en/house-of-ai) — interdisciplinary applied AI | Manufacturing, electrical grids, health/wellbeing. | Possible source of an industry/research brief; no confirmed Junction ownership. |

## 7. What would impress a judge?

**Evidence:** the 2025 winner’s social value and implementation mattered; House of AI explicitly seeks research excellence and impact. **INFERENCE:** show a working interaction, a simple baseline, reproducible evaluation and one concrete improvement. Report task success, latency, failure cases and limits. For accessibility, measure whether a person completes the task; for machines, count failures; for energy, quantify savings under stated constraints.

A generic LLM wrapper is weak **if it lacks a demonstrated contribution**. A voice interface can be competitive when it removes a documented barrier. Avoid fabricated user validation, untested medical claims, hidden manual intervention and complexity without benefit. Research novelty may help, but no published November rubric establishes its weight.

## 8. Project seeds — adapt after release

All four are **SPECULATION**, not projects to prebuild.

| Problem / core idea | 48-hour MVP and live demo | Why Aalto might care / partner candidates |
|---|---|---|
| Voice systems mishear consequential details; **confirmation layer** | Extract appointment fields, read them back, request correction. Inject noise live; measure field errors and completion time. | Accessible, inspectable AI; OpenAI + Modal. |
| Seniors face friction finding activities; **voice-to-action navigator** | Search a small verified activity catalogue, filter access constraints, create an editable plan. Demonstrate a corrected request with cited sources. | Independence/social participation; City of Espoo + Exa. |
| Machine anomalies are poorly explained; **maintenance replay** | Replay sensor traces, compare a threshold baseline with anomaly scoring, show evidence for alerts. Inject a fault live. | Reliable industrial AI; Arduino + Modal/NVIDIA. |
| Flexible demand wastes money; **constraint-aware scheduler** | Schedule three synthetic loads against supplied prices; compare fixed scheduling and visualise trade-offs. | Grid research; Verda/Modal, City of Espoo if suitable data appears. |

## 9. Strongest cross-partner combinations

Architecture proposals only: confirm credits, supported models and cross-track eligibility at release.

1. **Aalto Finnish ASR → Modal inference → OpenAI reasoning → accessible frontend:** separates recognition from action; benchmark each component. [Modal GPU documentation](https://modal.com/docs/guide/gpu).
2. **Aalto accessibility methods → Espoo activity sources → Exa retrieval → model → frontend:** grounded recommendations; preserve dates and source links. [Exa search/contents](https://exa.ai/docs/reference/search).
3. **Aalto autonomy methods → Arduino sensing/control → NVIDIA-compatible compute → dashboard:** tangible demonstration, with deterministic safety limits. [UNO Q](https://docs.arduino.cc/hardware/uno-q/).
4. **Aalto HCI methods → Cloudinary image delivery → vision model → comparison interface:** test chart comprehension against source values, not just fluent descriptions. [Cloudinary transformations](https://cloudinary.com/documentation/image_transformations).

Google DeepMind’s partnership does not itself promise an API. Do not equate Google DeepMind sponsorship with Gemini credits. AfterQuery, Cala AI, Valio Aimo and Featherless should enter the stack only if their released resources solve a specific need.

## 10. Preparation checklist

### Definitely do

- [ ] Bookmark the 2025 recap, AR4U and model card; reread the released brief before choosing.
- [ ] Rehearse microphone capture, 16 kHz conversion, transcript correction and a measured API round trip using disposable examples.
- [ ] Prepare an evaluation template: baseline, task success, latency, cost, failure case, reproducibility.
- [ ] Assign developers to UI, backend and integration; Markus owns brief interpretation, evaluation and pitch evidence.
- [ ] Prepare five mentor questions: owner, target user, supplied assets, judging priorities, allowed external services.

### Worth doing

- [ ] Cache the Base ASR weights and a few consented test clips; compare with a hosted recogniser.
- [ ] Read the [2025 speech paper](https://www.isca-archive.org/interspeech_2025/getman25_interspeech.html) and [Chartist abstract](https://arxiv.org/abs/2502.03575).
- [ ] Test Exa and one compute provider account/SDK; rehearse Docker and a replay-based hardware demo.

### Wait until challenge release

- [ ] Download large datasets, reproduce REACT, fine-tune models or select hardware.
- [ ] Choose users, evaluation targets, deployment location and final partner stack.
- [ ] Build competition functionality; check rules on reuse of preparation code first.

## 11. Risks and traps

Public code does not imply redistributable training data. Check data, model and dependency licences separately: Junction currently states MIT-open-source submissions, which does not override third-party terms. Avoid copying restricted recordings or secrets into the repository.

REACT can consume the weekend in ROS/GPU setup. Finnish model accuracy on conversational seniors is unproven; its card reports **22.27% test WER** on Donate Speech, not an elderly-user guarantee. Finnish documentation, streaming latency, noise and unreliable connectivity can break a polished demo. Keep a labelled replay fallback.

Do not assume access to LUMI, private company traces, clinical data, senior participants or a robot. A simulation is useful evidence only when its assumptions are explicit. The largest strategic trap is treating last year’s unit as this year’s sponsor.

## 12. Final hackathon cheat sheet

| Item | Team takeaway |
|---|---|
| Partner | Aalto University |
| Challenge-partner status | Confirmed in supplied listing; internal ownership unverified |
| Likely internal unit | Unknown; AR4U/School of Science is the strongest historical lead |
| Most likely themes | Accessible/ageing AI; human–AI interaction; physical AI as reserve |
| Relevant groups | AR4U, Speech Research, Oulasvirta HCI, Intelligent Robotics, House of AI |
| Most useful resource | Finnish wav2vec2 Base fine-tuned weights |
| Promising direction | Accessible workflow with measurable reliability and human correction |
| Best combinations | Modal + OpenAI; Espoo + Exa; Arduino + NVIDIA |
| Best preparation | Voice pipeline rehearsal plus evaluation/pitch template |
| Biggest uncertainty | 2026 challenge owner, assets and rubric |
| Biggest trap | Building around an assumed repeat of 2025 |
| Hackathon relevance | **8/10** — strong fit for this team, conditional on brief |
| Confidence | **5/10** — solid precedent/resources, weak November attribution |

Scores are editorial assessments, not sponsor ratings.

### Five things our team should remember about Aalto

1. Find the actual challenge owner before choosing the technical stack.
2. Last year rewarded thoughtful social connection and accessible implementation.
3. Measure a user or system outcome against a simple baseline.
4. Public research assets can still have difficult dependencies and separate licences.
5. Use mentors early, and show the prototype’s limits honestly.