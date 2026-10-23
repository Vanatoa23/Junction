# AfterQuery — Junction 2026 partner intelligence

> **Roster update — 24 October 2026:** independently confirmed in the official page's partner section as **Challenge**. This update supersedes earlier uncertainty about the listing/tier below. The original product research date remains as stated; API versions, prices and access in the older report have not all been re-tested or re-researched. Challenge briefs remain TBA. [Current coverage and source record](README.md).

**Research cutoff: 7 October 2026. Team: Markus + three full-stack developers.**

**Recommendation:** prepare a reusable agent evaluation kit, then adapt it to the announced challenge. Your strongest starting point is a finance or operations workflow with a resettable environment, independently checked outcomes and visible failure recovery. Do not commit to training a model beforehand.

**Evidence labels:** CONFIRMED = documented activity; INFERENCE = interpretation of that activity; SPECULATION = possible challenge. Probability labels below express relative plausibility, not measured odds.

## 1. What AfterQuery actually does

**CONFIRMED:** AfterQuery supplies expert-derived training data and environments for foundation-model development: supervised fine-tuning prompt/response examples and reasoning demonstrations; RL tasks with rubrics/verifiers; API/MCP tool environments; and browser/desktop interaction trajectories. These support **post-training**—improving an existing model after its initial training—and evaluation. [Company](https://www.afterquery.com/) · [Products](https://www.afterquery.com/products)

Ordinary labeling might identify the category of a document. Capturing expertise records how someone reconciles conflicting documents, chooses an assumption, uses tools, checks the result and corrects an error. A verifier checks objective properties; a rubric encodes expert standards where correctness is multidimensional. An environment provides the state and actions needed to perform the task.

**INFERENCE:** its strategic differentiation is the combination of professional task construction, demonstrations, environments and feedback signals—not annotation volume alone. Preserve observable actions, evidence and expert-authored explanations; do not confuse an agent's generated rationale with verified expertise.

## 2. Why it is probably at Junction

The [research index](https://www.afterquery.com/research) documents IDE-Bench in January 2026, terminal-agent post-training in March, GDPval-related work in June/July, banking-agent training in July, and Legora collaboration in August. SpreadsheetBench 2 is also featured. The recurring theme is completing economically useful work across files, tools and decisions.

**CONFIRMED priorities:** expert data quality, computer use, professional deliverables, custom evaluations and tool-use training. **INFERENCE about Junction:** builders can create new environments, measurable workflows and failure datasets that expose capability gaps. Recruitment and ecosystem-building are plausible secondary motives, but unverified.

NVIDIA's [technical report, office/workplace teacher section](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Ultra-Technical-Report.pdf) independently documents using AfterQuery tasks and trajectories for SFT warmup and pivot-based distillation. This substantiates a concrete training use, without proving AfterQuery data alone caused every reported gain.

## 3. Previous hackathons and challenge availability

Searches for AfterQuery + Junction, Junction 2025, hackathons and sponsored events found **no meaningful public previous Junction challenge, winner, judging rubric or attributable employee announcement**. This is a search limitation, not proof that none exists. The [2025 event page](https://hackjunction.app/hackathons/junction-2025) does not establish an AfterQuery track.

Treat its 2026 Challenge Partner status as supplied in your brief. The retrieved [2026 website](https://2026.hackjunction.com/) has image-based partner listings that did not independently resolve that specific status in text. The [event platform](https://hackjunction.app/hackathons/junction-2026) says tracks are not locked yet. No AfterQuery challenge statement, attending team, supplied dataset, credits or framework was verified.

Ask mentors first: **What is provided? What must be built? What is scored? Can we combine tracks? Are prebuilt evaluation utilities permitted?**

## 4. Plausible challenge directions

All rows are **SPECULATION informed by confirmed research**, not announced challenges.

| Theme / probability | Evidence | Possible statement → build | Likely evaluation / difficulty |
|---|---|---|---|
| Real-work agent benchmark / High | IDE, App, BAR | “Measure useful agents” → tasks, sandbox, runner, scorecard | Hidden outcomes + expert criteria / Medium |
| Tool-use reliability / High | API/MCP products, banking | “Complete workflows despite failures” → agent with recovery and state tracking | Final state, policy compliance, cost / Medium |
| Expert demonstrations / Medium | SFT and computer-use products | “Turn work into training data” → recorder, task schema, validated exports | Replayability, expert fidelity / Medium |
| Verifier/reward design / Medium | Terminal RL, PivotRL | “Make professional work gradeable” → independent grader with failure cases | Human agreement, resistance to gaming / Medium–high |
| Office/computer-use agents / Medium | SpreadsheetBench 2, GDPval | “Deliver a finished work product” → spreadsheet/document agent | Artifact correctness + usability / High |
| Small-model improvement / Low | Banking and terminal post-training | “Improve a supplied model” → limited training experiment | Held-out success at fixed budget / High, access-dependent |

## 5. The philosophy that should shape our solution

The [AfterQuery Thesis](https://www.afterquery.com/blog/the-afterquery-thesis) argues that tacit professional expertise and granular feedback are missing ingredients: knowing a formula differs from choosing the right inputs and applying conventions under uncertainty. Treat this as the company's thesis, not established proof that more compute or internet data cannot help.

**INFERENCE:** an interesting submission exposes consequential decisions, produces a useful artifact, detects mistakes and demonstrates improvement on unseen cases. A shallow submission talks fluently about work without completing or checking it. A chatbot, RAG system or single API call can be useful, but needs evidence of task value; calling it “agentic” does not establish sustained tool use.

## 6. Benchmark design lessons

| Benchmark / primary source | Capability and task format | Evaluation | Design lesson |
|---|---|---|---|
| [SpreadsheetBench 2](https://spreadsheetbench.github.io/) | 321 expert-curated workbook modeling, debugging and visualization tasks | Target-cell correctness and preservation; chart assertions graded by VLM | Check collateral damage as well as requested changes |
| [FinanceQA](https://arxiv.org/abs/2501.18062) | Numerical professional analysis with incomplete information and assumptions | Financial-answer correctness; inspect task references before implementing a grader | Score assumptions and accounting conventions, not arithmetic alone |
| [Market-Bench](https://www.afterquery.com/leaderboard/market-bench) | Generate backtesters for scheduled trading, pairs trading and hedging | CSV error versus reference simulator; execution reliability | Executable code can still have wrong state/accounting; this is not live-trading profitability |
| [App-Bench](https://www.afterquery.com/leaderboard/app-bench) | Six full-stack applications from one prompt, without human edits | Two developers independently test binary functional criteria and resolve disagreements | Verify persistence, roles and interactions; appearance is insufficient |
| [UI-Bench paper](https://arxiv.org/abs/2508.20410) | Visual design of generated websites: 30 prompts, 300 sites | Expert pairwise preferences with TrueSkill-derived ranking | Aesthetic preference and functional correctness require separate evaluations |
| [IDE-Bench](https://www.afterquery.com/leaderboard/ide-bench) | 80 tasks across eight codebases; iterative file/tool interaction | Tests plus semantic diff grading; pass@1/pass@5, traces and usage | Hide solutions, reset each attempt, and disclose retry budgets |
| [Legora BAR](https://legora.com/bar) | Legal matters with document rooms and final deliverables | Expert binary criteria, importance weighting and LLM judges; repeated runs | Make domain experts validate criteria and distinguish substantive from cosmetic errors |
| [τ³-Banking experiment](https://www.afterquery.com/blog/improving-qwen35-9b-on-t3-banking) | Conversational banking tool-use tasks | 97 evaluation tasks, five attempts; pass@5 and average success | Local action rewards can improve without improving whole-task success |

BAR's main corpus is private; one synthetic case is public. UI-Bench measures design preference, despite the research index's “UI understanding” wording. Do not assume every benchmark uses a deterministic grader or that every reported score means full task success.

## 7. Resources we can actually use

Setup times are **our estimates**, not tested installation guarantees.

| Resource / official link | Purpose → Junction use | Setup / difficulty |
|---|---|---|
| [FinanceQA dataset](https://huggingface.co/datasets/AfterQuery/FinanceQA) | Public financial questions → inspect realistic assumptions and build a small baseline | Download; Python/pandas optional; 15 min for inspection, longer for evaluation |
| [SpreadsheetBench 2 code](https://github.com/RUCKBReasoning/SpreadsheetBench-2) + [data](https://huggingface.co/datasets/KAKA22/SpreadsheetBench-v2) | Workbook tasks/grading → borrow preservation checks | Python, files and spreadsheet computation/rendering dependencies; several hours |
| [IDE-Bench repository](https://github.com/AfterQuery/ide-bench) | Dockerized harness and task schema → adapt one software task | Python/uv, Docker, model credentials; several hours; verify available datasets rather than assuming all eight ship |
| [Harbor](https://github.com/harbor-framework/harbor) | Container-based agent evaluation → resettable tasks and trajectory collection | Python, container backend and model access; 1 hour for orientation, several hours to integrate |
| [Legora BAR](https://legora.com/bar) | Public synthetic matter/scoring example → study expert criteria | Reading: 15 min; reconstructing evaluation: several hours; private harness unavailable |
| [Tinker](https://thinkingmachines.ai/tinker/) | Managed post-training → optional supplied-model experiment | Account/access, training data and spend; risky until tested |

**No general-purpose public AfterQuery developer API or downloadable universal MCP server was verified.** Its [catalog](https://www.afterquery.com/products) is access-request based. Describing API/MCP environments does not mean providing a self-service API. Commercial Office Agent and banking training data should be treated as unavailable until access is explicitly granted.

## 8. Tooling ecosystem

AfterQuery's [terminal experiment](https://www.afterquery.com/blog/how-we-improved-terminal-bench-2-with-tinker-and-harbor) combines Tinker, Harbor and gpt-oss-20b: SFT on successful trajectories, then RL with per-test rewards. Reported Terminal-Bench success rose from 3.1% to 17.0%; the absolute result matters more than “5×”. This supports collecting successful traces and partial failure information, not attempting to reproduce the training run during Junction.

OpenAI, Anthropic and Gemini models appear in benchmark comparisons; a provider adapter allows fair comparisons under the same tools and budgets. Open-weight Qwen/Nemotron models offer optional cost or deployment comparisons, not guaranteed parity.

The banking article uses **NeMo Evaluator** for general-capability checks. NVIDIA's broader recipe includes NeMo-related infrastructure; **NeMo-RL and vLLM were not verified as requirements of AfterQuery's supplied hackathon stack**. Learn their roles—training and inference infrastructure respectively—only if a provided environment needs them. MCP is useful for portable tool interfaces; a simple HTTP/function interface is sufficient for an MVP. Browser agents add realism but also UI brittleness: prefer API interaction unless computer use is central to the challenge.

## 9. What would impress a judge?

**INFERENCE, not published judging criteria:** a meaningful workflow, resettable environment, independent verifier, expert-approved criteria, unseen variations, recoverable failures, useful trace exports and a measured improvement at disclosed cost. Show one success, one failure and why it failed.

App-Bench documents missing features, broken role flows and runtime errors; the practical response is to demonstrate that the whole workflow works. Generic chat, superficial RAG, prompt wrappers, trivial synthetic questions and an unscored demo are weak **when they cannot establish useful outcomes**. Visual polish still helps communicate a working system.

## 10. A reusable evaluation layer

Use: **task → reset environment → agent actions → artifact/state → independent verifier → score + trace**.

| Pattern | Example | Independent checks |
|---|---|---|
| State-transition | Finance transfer or logistics rebooking | Correct balances/reservations; no duplicate transaction |
| Artifact integrity | Spreadsheet repair or research report | Required content correct; unrelated data preserved; evidence supports claims |
| Expert rubric | Municipality application triage | Required facts, justified decisions, uncertainty, appropriate escalation |
| Fault recovery | Operations workflow with API timeout | Retry safely, avoid duplicate writes, finish or explain bounded failure |
| Constraint satisfaction | Delivery routing or simulated robot plan | Capacity, deadlines and safety constraints; completion, time and cost |

Use deterministic checks first; reserve rubric judges for interpretation. Calibrate judges against a small human-scored set. Report whole-task success separately from partial criteria scores.

## 11. Project seeds

All are adaptable proposals, not expected challenge submissions.

| Problem / core idea | Fit and 48-hour MVP | Evaluation / live demo / stack |
|---|---|---|
| Financial reconciliation errors → **ReconcileLab** | Expert finance workflow; fixture ledger, invoices, four tools and exception queue | Hidden balances and exception matches; inject duplicate invoice; Python, SQLite, React |
| Brittle operations agents → **RecoveryArena** | Reliability environment; mock supplier/order service with timeouts and stock changes | Correct final order, no duplicates, cost; replay failed then recovered run; TypeScript, Docker, React |
| Expertise lost in demonstrations → **WorkflowCapture** | Demonstrations to reusable tasks; instrument one sample app, annotate choices, export JSONL | Replay and expert checklist; convert a human run into an agent task; Playwright, Node, SQLite |
| Broken generated apps → **AppAcceptance** | Functional evaluation; two-user browser scenarios for roles, persistence and one workflow | Hidden Playwright assertions; polished app fails then repair passes; Playwright, Docker, Next.js |
| Unsupported research claims → **EvidenceDesk** | Professional deliverable evaluation; fixed source pack plus retrieval and claim table | Source support, omissions and contradictory evidence; insert conflicting source; Python, model API, React |

**Best fit for Markus:** ReconcileLab uses your banking/analysis experience to define realistic invariants while teammates build the environment, agent and demonstration interface. Avoid presenting an educational fixture as a validated banking system.

## 12. Five strongest cross-partner combinations

These are **architecture proposals** using the partner list supplied in the brief; credits, access and combined-track eligibility remain unverified.

| Pairing | Architecture / advantage |
|---|---|
| OpenAI or Google DeepMind + AfterQuery | Same expert tasks → two agents → shared tools/verifier; compare reliability rather than marketing model rankings |
| NVIDIA + AfterQuery | Professional task → accessible Nemotron endpoint → verifier; documented collaboration gives clear thematic fit, but avoid local large-model training |
| Valio Aimo + AfterQuery | Order/stock workflow → procurement agent → state verifier; concrete product outcome if usable domain data is supplied |
| City of Espoo + AfterQuery | Municipality task → source-grounded agent → expert criteria; emphasize justified escalation and evidence |
| Exa + AfterQuery | Research workflow → retrieval agent → claim/evidence evaluator; score completed research, not number of search results |

Modal/Verda are potential execution infrastructure; Featherless a possible inference route. Verify supported models, endpoint behavior and event entitlements before using them. Arduino adds physical constraints but setup risk; Aalto could contribute a research task or validation expertise if its actual track supports that. Cala AI's relevant interface was not established here, so no specific dependency is proposed.

## 13. Preparation before Junction

**Definitely prepare:** one resettable mock service; JSON task/trace schema; deterministic state verifier; 10–20 varied tasks with a hidden subset; baseline agent; bounded retries/timeouts; cost logging; human-reviewed rubric; replayable dashboard. This is a pilot evaluation, not a statistically definitive benchmark.

**Worth understanding:** pass@1 versus best-of-k, partial versus whole-task scores, judge calibration, demonstration export, MCP and browser interaction. Read Thesis, App-Bench, BAR and the banking experiment first.

**Do not spend time on yet:** GPU RL, frontier-paper reproduction, every benchmark installation, Kubernetes, custom training infrastructure or a complete desktop automation platform.

Suggested division: Markus owns tasks/rubrics/pitch; developers own environment/verifier, agent integration, and dashboard/replay. Freeze a working baseline early and improve one measured failure class.

## 14. Risks and traps

| Trap | Avoidance |
|---|---|
| Training consumes the weekend | Improve tools, context and recovery first; train only with supplied, pretested infrastructure |
| Ambiguous or circular judging | Human-approved reference criteria; deterministic checks; audit model-judge disagreements |
| Tiny sample and cherry-picking | Show denominators, every run and repeat attempts; separate illustrative demos from aggregate results |
| Leakage or reward gaming | Keep references outside agent access; hidden variants; check final outcomes, not self-reported success |
| Synthetic tasks lack realism | Base fixtures on actual workflow rules and expert review; disclose simplifications |
| Numbers without product value | Tie scores to correct deliverables, prevented errors or completed work |
| Expensive inference/framework sprawl | Fixed run budgets, one agent loop, two model adapters at most |
| Unreproducible demo | Reset seed/state; cache a clearly labeled replay; retain logs and a working local fallback |

The banking experiment explicitly reports rising in-sample verifier rewards without further end-to-end gains. Keep an independent holdout; optimizing the grader is not automatically improving the product.

## 15. Final cheat sheet

| Item | Answer |
|---|---|
| Partner | AfterQuery |
| Fundamental concern | Encoding professional expertise into useful data and feedback |
| Current focus | Tool/computer-use agents, deliverables, evaluation and post-training |
| Likely themes | Real-work evaluation, reliable workflows, demonstrations; unconfirmed |
| Read first | Thesis; App-Bench; BAR; τ³-Banking experiment |
| Most relevant benchmark | SpreadsheetBench 2 for your finance angle; IDE-Bench for the developers |
| Most useful concept | Independent verification of final environment state |
| Promising direction | ReconcileLab or RecoveryArena |
| Best combination | Valio Aimo for workflow value; NVIDIA for documented technical alignment |
| Impress / bore | Measured reliability improvement / fluent output without outcome evidence |
| Prepare | Resettable task runner, verifier and trace viewer |
| Biggest uncertainty | Actual challenge, supplied assets and scoring rules |
| Biggest trap | Spending 48 hours on training instead of a working evaluated system |
| Hackathon relevance | **9/10**, subjective: evaluation transfers across tracks |
| Confidence | **8/10 company understanding; 3/10 challenge prediction**, subjective |

### Five things our team should remember

1. AfterQuery's work centers on doing professional tasks, not merely answering questions.
2. A useful environment and clever verifier may be stronger contributions than a new model.
3. Check the final state and preserved constraints, not the agent's claims.
4. Show failures, retry budgets and cost alongside successes.
5. Keep all challenge predictions provisional until Junction publishes the rules.