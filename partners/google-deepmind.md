# Junction 2026 partner intelligence — Google DeepMind

**Checked: 10 October 2026.** For a four-person team with three full-stack developers and Markus owning research, architecture, evaluation and pitch. Recommendations are **INFERENCE**, not partner judging criteria. Narrative is condensed; tables provide implementation detail across the requested topics. No authenticated API calls or account-specific quota checks were performed.

**Friday default: Gemini 3.8 Flash through the paid Gemini Developer API, using Interactions and a few validated application tools.** Add one specialized capability only when it changes the user outcome. Google’s strongest differentiation is the combination of live perception, grounded reasoning and bounded action—not a chatbot with a partner logo.

## 1. What the partnership actually means

**CONFIRMED FOR JUNCTION:** DeepMind is teaming up with Junction; a benefit for winning teams is announced but unspecified. It appears in its own featured block, not under a clearly assigned partner tier. Challenge tracks remain TBA. The Hardware Lab separately confirms Arduino UNO Q boards, components, printers and LeRobot arms. The preliminary opening-to-submission window is Friday 18:00 to Sunday 10:00: approximately 40 build hours despite the event’s 48-hour branding. [Junction 2026](https://2026.hackjunction.com/)

| Status | What the team can safely assume |
|---|---|
| CONFIRMED FOR JUNCTION | Partnership; unspecified winning-team benefit; separately advertised hardware lab |
| Not publicly confirmed in inspected material | DeepMind tier, challenge ownership or Technology Partner designation; participant keys/coupons; Gemini/Cloud/Vertex credits; quota increases; Google workshops/mentors; dedicated prize details |
| Not publicly confirmed | Research visits, interviews, recruitment opportunities; special Robotics, Veo, image, Lyria, Deep Research or private/beta access |
| PUBLICLY AVAILABLE TO ANY DEVELOPER | Documented Gemini APIs, subject to region, billing, quota and model eligibility |
| PRIVATE/PREVIEW/RESTRICTED | Preview endpoints carry lifecycle risk; research demonstrations do not establish API or hardware access |
| SPECULATION | Any claim that winning means a DeepMind visit, interview or exclusive model access |

**Mentor questions:** What is DeepMind’s exact role and judging remit? Which winners qualify, and for what? Are keys, credits, quotas and billing supplied? Which endpoints are enabled? Is Robotics support available for the actual arm? Are workshops or mentors scheduled? Obtain written details before depending on benefits.

## 2. What our code actually calls

There is no generic “Google DeepMind API.” DeepMind develops models; developer-facing Google services expose them.

| Name | What it is | Access | Junction relevance |
|---|---|---|---|
| Google DeepMind | Model research/development organization | Its models through Google products | Partner identity and technical direction |
| Gemini | Model family | Named model endpoint | Reasoning and multimodal inference |
| Google AI for Developers | Developer documentation/platform entry point | ai.google.dev | Check current compatibility |
| Google AI Studio | Experimentation and key/project interface | Browser | Markus tests prompts, Live and examples |
| Gemini Developer API | Application API | API key; `generativelanguage.googleapis.com` | Lowest-friction default |
| Google GenAI SDK | Client libraries | Python `google-genai`; TS `@google/genai`; Go `google.golang.org/genai`; Java `com.google.genai:google-genai` | Async/streaming, Files, tools, schemas and Live, with language-specific coverage |
| Vertex AI / Google Cloud | Cloud deployment and governance platform | Cloud project, billing, IAM/credentials | Enterprise data controls and regional deployment |

Use a TypeScript backend with `@google/genai`, server-side `GEMINI_API_KEY`, and Zod validation; Python/Pydantic is equally suitable. Avoid legacy `google-generativeai`/`@google/generative-ai` tutorials. [SDK libraries](https://ai.google.dev/gemini-api/docs/libraries)

**Interactions is GA and recommended for new projects.** It supplies optional server-side state via `previous_interaction_id`, streaming, observable steps and background agents; default storage requires attention, with `store=false` for stateless calls. `generateContent` remains supported. Keep it where required by a capability, including Veo. [Interactions](https://ai.google.dev/gemini-api/docs/interactions-overview) · [generateContent reference](https://ai.google.dev/api/generate-content)

## 3. Model choices that matter

Context limits marked “check” were not established from the inspected overview; do not invent a common limit across specialized endpoints. Run `models.list/get`, inspect supported methods and then test the exact account/endpoint before November. [Models API](https://ai.google.dev/api/models)

| Endpoint/model | Input → output; context | Reasoning/tools | Latency/use | Status |
|---|---|---|---|---|
| `gemini-3.8-flash` | Text/image/audio/video → text; 1M input, 64K output | Low/medium/high; functions and built-in tools | Interactive general agent | Stable |
| `gemini-3.6-flash`, `gemini-3.5-flash-lite` | Multimodal → text; check endpoint | General tools; cheaper/speed alternatives | Fallback/high-volume classification | Stable |
| `gemini-3.1-pro-preview` | Multimodal → text; check | Strong reasoning/functions | Difficult cases after evaluation | Preview |
| `gemini-3.8-live` | Audio/images/text → audio plus transcription; check | Interleaved reasoning, async functions, Search | Real-time conversation | Stable |
| `gemini-3.8-live-extended-thinking` | Same family; check | More background reasoning | Voice tasks requiring deliberation | Stable |
| `gemini-embedding-2` | Text/image/video/audio/PDF → vectors; 8,192 tokens | No agent tools | Cross-modal retrieval | Public model |
| `gemini-robotics-er-2-preview` / `…-streaming-preview` | Multimodal → spatial reasoning/text/tools; check | Robot orchestration/functions | Camera-guided bounded tasks; streaming for continuous input | Preview |
| `deep-research-preview-04-2026` / `deep-research-max-preview-04-2026` | Research request → cited report; managed context | Autonomous research | Minutes; asynchronous evidence gathering | Preview |
| `antigravity-preview-09-2026` | Task/files → agent results; runtime-managed | Linux sandbox, code, files, web | Long-running autonomous work | Preview |
| `gemini-nano-banana-2.1` | Text/reference media → images/text | Conversational editing | New visual content | Stable |
| Veo 3.1 Standard/Fast/Lite | Text/image → video with audio | Generation controls, not agent tools | Asynchronous creative workflow | Preview |

The catalogue recommends 3.8 Live over legacy 3.1 Flash Live. Gemini 2.5 access is restricted to existing users, although those models are not all deprecated. ER 1.6 **was deprecated on 31 August 2026**; use ER 2. [Catalogue](https://ai.google.dev/gemini-api/docs/models) · [Robotics](https://ai.google.dev/gemini-api/docs/robotics-overview)

Flash supports coding, multimodal reasoning, function calling, structured output, Search, Maps, URL Context, File Search, Python execution and Computer Use, subject to tool combinations. Medium thinking is default; low reduces latency and token consumption. **INFERENCE: budget for Flash covering roughly 80% of plausible AI application steps**, not 80% measured accuracy or projects. Specialize for continuous voice, embeddings, embodiment or content generation; test Pro only on failed difficult cases. [Flash 3.8 guide](https://ai.google.dev/gemini-api/docs/latest-model)

## 4. Build patterns: tools, schemas, Live and MCP

`goal → Gemini → validated call → application authorization/execution → call-ID-linked result → Gemini → response`

Functions use JSON schemas; selection can be automatic or constrained, with multiple/parallel calls where supported. Serialize dependent writes, preserve SDK-managed reasoning/signature context, and return explicit failures. The model proposes actions; code checks ownership, arguments, limits and permissions. [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)

Structured output supports Pydantic, Zod and REST JSON Schema subsets, streaming and Gemini 3 tool combinations. Replace most free-form parsing for extraction, classification, state and evaluation. Buffer streamed JSON until complete; validate IDs, units, ranges and factual evidence afterward. Large/deep schemas can be rejected; schema-valid output can still be wrong. [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

**Live architecture:** `microphone/camera → Live WebSocket → proposed function → backend policy/tool → result → spoken response`. Browser implementation is moderate effort: audio capture/resampling, playback queue, microphone permissions and ephemeral tokens. Mobile adds lifecycle/audio-focus complexity; Python backend simplifies orchestration but introduces another media hop. Support interruption, cancelled/outstanding calls, reconnection, session resumption and bounded history. Images are JPEG frames at up to 1 FPS, not unrestricted full-rate video. [Live overview](https://ai.google.dev/gemini-api/docs/live-api) · [3.8 Live](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-live)

| Choice | Advantages | Costs/tradeoffs | Choose for |
|---|---|---|---|
| Native Live | Low latency, barge-in, expressive speech, visual context | Stateful debugging; transcript is an observation, not guaranteed verbatim audit; session/tool races | Hands-busy kitchen, accessibility, physical interfaces |
| STT → Flash → TTS | Inspectable intermediate text; explicit reasoning/retries; replace components | More latency; interruption/playback cancellation must be engineered; sum three services’ costs | Auditable citizen-service forms, precise scripted workflows |

**INFERENCE:** Live is mature enough for a bounded product capability, provided task completion beats a text baseline and noisy-room tests pass; it is not automatically more reliable or cheaper.

**Remote MCP has contradictory official documentation.** The function guide shows Flash 3.8 `mcp_server` examples; the Interactions overview still says Gemini 3 remote MCP is coming soon. Treat direct Flash support as **documented but operationally unverified**. Schema: `type`, `name`, `url`, `headers`, `allowed_tools`; Streamable HTTP only, snake_case names. Deep Research explicitly supports remote MCP. Test discovery, authentication expiry and error results; otherwise run MCP in the backend and expose ordinary functions. [Function/MCP guide](https://ai.google.dev/gemini-api/docs/function-calling#remote-mcp-model-context-protocol) · [Interactions limitations](https://ai.google.dev/gemini-api/docs/interactions-overview)

| Partner MCP | Direct integration assessment |
|---|---|
| Exa | Public `/mcp`; strongest read-only smoke test ([official](https://exa.ai/mcp)) |
| Cloudinary | Hosted Streamable HTTP `/mcp`; credentials/tool filtering required ([repository](https://github.com/cloudinary/mcp-servers)) |
| Hostinger | Hosted HTTP endpoint with OAuth; URL alone does not solve token acquisition/refresh ([official](https://www.hostinger.com/support/11079316-hostinger-api-mcp-server/)) |
| Verda | Documented CLI MCP is local process configuration; needs backend client/bridge, not direct remote URL ([docs](https://docs.verda.com/cli/mcp/)) |
| CRACI / Cala | No authoritative public MCP endpoint verified in this research; do not invent one |

MCP can standardize integration, but five servers multiply schemas, auth, latency, outages and write permissions. Start with one server and a tiny allowlist.

## 5. Grounding, RAG and calculations

| Capability | Practical choice and constraint |
|---|---|
| Search grounding | Model decides whether/how often to search; return `groundingMetadata`, queries, source chunks and support spans; render citations and required Search attribution. Multiple queries can occur per prompt. Use for immediate sourced answers; check model/tool compatibility. [Search](https://ai.google.dev/gemini-api/docs/google-search) |
| Exa / ordinary search / RAG | Exa when application-controlled discovery, extraction and evidence selection matter; ordinary search API for explicit query/ranking control; RAG for a known corpus. Combine `Exa → selected evidence → Gemini → action`; preserve source IDs. [Exa](https://exa.ai/mcp) |
| Maps grounding | Places and location-grounded answers with Maps links/attribution; globally scoped but regional availability varies; currently English prompts/responses only. Use for local discovery, not certified accessibility or transit truth; verify Search combinations before coding. [Maps](https://ai.google.dev/gemini-api/docs/maps-grounding) |
| Municipal/transit/OSM | Prefer authoritative city data for eligibility/accessibility and Digitransit for routes/disruptions; OSM for controllable map geometry. Grounded place prose is insufficient evidence that a route is wheelchair-accessible. |
| URL Context | Known authoritative public URLs → retrieval: up to 20 URLs/request, 34 MB each; HTML/text/JSON/CSV/images/PDF; no login/private network or automatic nested-link crawl. Search discovers unknown sources. [URL Context](https://ai.google.dev/gemini-api/docs/url-context) |
| File Search | Managed ingestion/chunking/embedding/retrieval/citations; persistent stores require explicit deletion. PDF/office/text/code formats; 100 MB/document; project storage 1 GB free, 10/100 GB/1 TB paid tiers; indexed size roughly 3× input. Not Live; cannot combine with Search/URL Context in the same request. [File Search](https://ai.google.dev/gemini-api/docs/file-search) |
| Custom RAG | Context stuffing for a tiny corpus; File Search/hosted RAG for ordinary document Q&A; pgvector/custom DB for row permissions, custom ranking, hybrid queries or portable retrieval. Avoid building your own stack without such requirements. |
| Python execution | Iterative Python, CSV/text input and chart output; 30-second runtime, up to five error retries; token billing without separate tool charge. Preinstalled libraries, not an arbitrary package/network backend. Good for exploratory calculations; execute recurring forecasts, optimization constraints and business arithmetic deterministically in your backend. [Code execution](https://ai.google.dev/gemini-api/docs/code-execution) |

## 6. Specialized capabilities: use only for a real need

**Computer Use:** Flash 3.8 proposes screenshot-based browser, Android/mobile and desktop actions with normalized coordinates and `intent`; your client executes and returns screenshots. Appropriate for one legacy form without an API; API tools win for speed, determinism and observability. Expect repeated inference/network/UI waits rather than a guaranteed latency. Token-priced screenshots and reasoning accumulate. [Computer Use](https://ai.google.dev/gemini-api/docs/computer-use)

Guardrail loop: `proposal → domain/action policy → confirmation if consequential → execution → screenshot`. Use disposable accounts, domain allowlists, step/time caps and redacted logs; block purchases, sends, deletion and credential access in demos. Treat page instructions as untrusted; honor model safety/confirmation signals without relying on them as the only injection defense. **INFERENCE:** viable for a constrained rehearsed live workflow, fragile as the whole product.

**Deep Research/Max:** managed planning and cited multi-source research via background Interactions; most tasks within 20 minutes, maximum 60. No structured output or custom functions; remote MCP is supported. Standard documentation estimates $1–$3/task; Max can explore considerably more. Use for asynchronous dossiers; Search grounding for interactive answers; custom Exa agent when evidence/control/evaluation is the innovation. Post-process into validated JSON with Flash. [Deep Research](https://ai.google.dev/gemini-api/docs/deep-research)

**Antigravity:** a hosted Linux agent runtime with planning, files, code and web search, not just a model. September preview adds code search and file editing. Public catalogue presence does not prove your account’s access; sandbox persistence, arbitrary networking and exact tool interfaces were not established here. Activate only after testing these requirements. [Agent model page](https://ai.google.dev/gemini-api/docs/models/antigravity-preview-09-2026)

**Embedding 2:** one space for text/images/video/audio/PDF enables photo→manual and text→clip retrieval, clustering and approximate duplicate/recommendation search. Chunk carefully: 8,192-token ceiling can silently truncate; PDFs max six pages, one file/request; video over 120 seconds needs segments. Text-only embeddings are simpler when media adds no value. [Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)

**Vision/video:** native OCR, charts, screenshots, documents and contextual interpretation often suffice for an MVP; benchmark counting and tiny text. Dedicated CV wins for calibrated detection/tracking; Cloudinary handles media preparation; self-hosted VLMs need a concrete control/privacy advantage. Video supports timestamps and audio; default 1-FPS sampling can miss fast motion. Agentic video exploration targets relevant segments; short clips suit static processing. Use Cloudinary clipping/frame selection when deterministic coverage or privacy filtering matters. [Video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)

**Generation:** Nano Banana 2.1 provides reference-conditioned images and multi-turn editing at 1K/2K/4K; compare OpenAI image models on fidelity, not branding. Cloudinary transformations suit resizing/cropping existing media; diffusion self-hosting suits custom weights. Veo supports 4/6/8-second options subject to settings, native audio, image input and first/last frames; Standard/Fast add reference images and extension. Poll async operations; generation can take minutes. Use for an actual training/creative workflow, pre-generate demo assets. Lyria is challenge-specific for music products. [Image generation](https://ai.google.dev/gemini-api/docs/image-generation) · [Veo](https://ai.google.dev/gemini-api/docs/veo)

## 7. Costs, quotas and data

**Planning costs in USD, excluding taxes, retries, growing histories and external services.** Introductory Flash rates last through December 2026. These are calculated examples, not fixed-price promises. [Current pricing](https://ai.google.dev/gemini-api/docs/pricing)

| Workload / price | Estimate |
|---|---|
| Flash standard $0.75/M input, $3.75/M output | 1,000 classifications × 500 input + 50 output tokens: **$0.56** |
| 1,000 agent turns × 2,000 input + 500 billed output | **$3.38**; reasoning included in output |
| Pro ≤200K prompt: $2/M input, $12/M output | Same turn workload: **$10** |
| Live: $0.005 input-audio minute, $0.018 output-audio minute | 60 minutes of each: **$1.38**, plus text/history/video |
| Search/Maps: $14/1,000 queries after allowance | 100 calls × 3 queries: **$4.20** beyond allowance, plus tokens |
| File Search $0.15/M indexing; Embedding 2 text $0.20/M | 1M-token ingestion: **$0.15**; independent text embedding **$0.20** |
| Computer Use | Ordinary model token rates; no fixed per-action cost |
| Nano Banana 2.1 1K image | About **$0.0336**, plus input/text |
| 20 eight-second 720p Veo videos | Standard **$64**, Fast **$16**, Lite **$8** |

Free quota is limited. Batch/Flex trade immediacy for discounts; Priority costs more; support varies by model. Use standard for judging and Batch for offline evaluation. Check **your project’s** RPM/TPM/RPD, Live concurrency and Batch limits in AI Studio; public documentation points to active limits instead of guaranteeing a universal quota table. Limits are project-level, and paid access is not unlimited. Preflight expected bursts, throttle, cap tool loops, retry 429s with jitter and test an independent fallback. [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

| Data sensitivity | Configuration decision |
|---|---|
| Synthetic/public | Paid Developer API is the straightforward demonstration default |
| Private partner documents | Partner permission, minimization, paid service terms, explicit retention/store choices |
| Personal/health/financial or municipal records | Prefer synthetic/de-identified input; use approved Vertex configuration where IAM/region/governance is required |

Outside EEA/UK/Switzerland, unpaid-service content may improve products and be human-reviewed; paid-service content is not used for product improvement. **EEA/UK/Swiss users receive the paid data-use treatment even for unpaid quota/AI Studio**; the terms also require paid services for API clients offered to users there. No-training does not mean zero retention. [API terms](https://ai.google.dev/gemini-api/terms)

Vertex does not train on customer data without permission, but abuse logs, caching and grounding have retention conditions. Developer API wins on setup; Vertex is worth IAM, billing and feature/region complexity when the dataset or sponsor requires enterprise governance. This is a service-selection guide, not legal advice. [Vertex data retention](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention)

## 8. Project seeds and partner combinations

All seeds are **INFERENCE**, scoped to a 40-hour build. Partner roles beyond the confirmed hardware lab require challenge/access confirmation. The first three are narrow Arduino concepts; no endpoint automatically supplies LeRobot motor control.

| Problem/user; MVP and live demo | Necessary capability; partner contribution | Metric; safety/fallback; main risk |
|---|---|---|
| Lab user says “that part”; select one of five tray objects and move it | ER 2, camera + LeRobot/Arduino; visual reference cannot be resolved from text alone | Correct selections/20; calibrated workspace, speed/joint limits, stop button; manual target selection; calibration |
| Assembly learner misses a step; detect completion before next instruction | Flash video or ER 2, camera + UNO Q indicator; temporal/visual evidence | Missed-step recall; indicator-only output; prerecorded clip; lighting |
| Operator requests tool handover; robot asks when ambiguous and recovers | ER 2 streaming + Live, camera/mic + arm; spatial and spoken interaction | Safe completions/20; named grasp routines and motion interlocks; simulate motion; hardware time |
| Kitchen worker checks stock visually and reserves a replacement | Live/Flash vision + Valio inventory mock/API; Cloudinary prepares media | Correct SKU/actions; reservation preview; text/photo fallback; illegible labels |
| Resident finds service and completes a draft request | Live + authoritative Espoo data + Maps discovery; accessibility use can pair Aalto expertise | Valid completed drafts/time; no submission without confirmation; text form; source/language limits |
| Technician photographs a fault to retrieve matching manual/video segment | Embedding 2 + Flash, Cloudinary asset corpus | Recall@5 and resolution time; cited suggestions; keyword baseline; retrieval quality |
| Analyst finds evidence, then updates a case record | Exa + Flash + one tool; Exa provides inspectable retrieval, AfterQuery-style harness provides objective task scoring if available | Supported claims and correct updates; draft-only writes; cached evidence; grounding errors |
| Clerk uses a legacy portal lacking API | Flash Computer Use + test browser; Hostinger can host mock workflow | Successful forms, action count; allowlisted sandbox; replay/manual mode; UI drift |

Strongest combinations: **Arduino**, **Cloudinary**, **Exa**, **Espoo**, **Valio Aimo**, and **AfterQuery-style evaluation**. Each supplies hardware, media, evidence, authoritative services, operational data or scoring that Gemini alone lacks. Aalto can add accessibility evaluation. Cala/CRACI need verified endpoints; Verda/Modal/NVIDIA only if custom inference is essential; Featherless/OpenAI are benchmark/fallback candidates, not automatic extra integrations.

## 9. Provider choice and team workflow

**INFERENCE:** prefer Gemini for native Live/vision, Maps/Search integration and ER reasoning. OpenAI also has real-time multimodal voice, remote MCP, search, file retrieval and computer-use tools; these categories are not uniquely Google. Prefer OpenAI when your representative tests or existing integration win; benchmark reasoning, coding, schemas, image fidelity, cost and reliability rather than claiming a universal winner. [OpenAI Realtime](https://developers.openai.com/api/docs/guides/realtime) · [OpenAI MCP/tools](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)

Featherless offers managed model diversity and potentially cheaper specialist inference; inspect each license, modality, concurrency and price. Managed open weights do not automatically give data control. [Plans](https://featherless.ai/docs/plans) · [Pricing](https://featherless.ai/docs/request-pricing-and-credits)

Use Verda/Modal self-hosting only for custom weights, local processing or demonstrable workload economics. Otherwise deployment, cold starts and optimization consume the weekend. Strategy A (Flash/tools) is default; B (one specialization) is the differentiation layer; C (multi-provider) needs a measured benefit; D (custom runtime) needs an explicit challenge requirement.

On Friday Markus freezes **20 representative tasks**, expected outputs and scoring before comparing providers. Keep evidence/tools, token limits and prompt intent equivalent; distinguish model-only from whole-product comparisons. Record success, citation correctness, unsafe actions, p50/p95 latency and billed usage; publish failure examples. Twenty cases guide selection, not broad statistical superiority. Developers build UI, backend/tools and deployment in parallel.

Google’s current releases emphasize autonomous software work, multimodality, live interaction and embodiment; scientific research capabilities do not establish hackathon access. **INFERENCE:** impress through a measured perception→reasoning→action improvement and responsible autonomy. No explicit DeepMind Junction rubric or verified prior DeepMind Junction winning-project precedent was established; Google developer/Cloud events and old Google swag listings are not equivalent evidence.

## 10. Preparation, routing and demo reliability

| Tier | Prepare |
|---|---|
| **1 — Definitely** | AI Studio project/key, billing, current SDK; Flash call, Zod/Pydantic output, one validated function, Search call, image input, usage/latency logging and fallback |
| **2 — Activate quickly** | Live, URL Context, File Search, Embedding 2, video; one MCP smoke test; learn Deep Research and Computer Use constraints |
| **3 — Challenge only** | ER 2 hardware integration, Antigravity, Veo/Lyria, elaborate routing, self-hosting |

Markus uses AI Studio to test difficult examples, Live interruptions and source fidelity while developers implement. Keep `generate()`, `generate_structured()`, `call_tools()`, `search_grounded()`, `embed()` and `live_session()` thin. Preserve provider-specific state, grounding metadata, thought signatures and audio events. Route statically by feature: ordinary→Flash, voice→Live, research→Deep Research, UI→Computer Use, robot→ER, vectors→Embedding 2, video creation→Veo; avoid dynamic routing until needed.

**2–3-hour exercise:** synthetic equipment checkout. Text/voice plus photo → Flash/Live → `reserve_item(item_id)` mock function → validation/confirmation → response; a separate Search call retrieves a public equipment guideline. Log cost and latency; inject wrong IDs, timeout and interruption; fall back to text and cached guideline. Success is ten repeatable completions, including safe failures—not a prebuilt submission.

- [ ] Key/billing valid; exact model supported; project quotas and fallback tested.
- [ ] Schemas and semantic rules tested; tool results linked; writes gated and idempotent.
- [ ] Thinking/output budgets capped; Search query counts logged; tool combinations tested.
- [ ] Live mic/camera permissions, audio device, reconnection and cancellation rehearsed.
- [ ] External services healthy; MCP auth refreshed; secrets excluded from browser/repository.
- [ ] UI domains restricted; prompt-injection cases tested; destructive actions disabled.
- [ ] Network timeout/retry bounded; local cached/replay demo clearly labelled.
- [ ] Preview/deprecation checks repeated before November; Veo assets generated beforehand.

## Final cheat sheet

| Field | Verdict |
|---|---|
| Partner / exact Junction role | Google DeepMind; featured partnership, tier/challenge role unconfirmed |
| Confirmed participant benefit / winner benefit | No concrete Google access benefit published / unspecified special benefit |
| Primary platform / default | Paid Gemini Developer API, Interactions / `gemini-3.8-flash` |
| General / differentiated / real-time | Validated tool-using multimodal reasoning / embodied perception-to-action / Live 3.8 |
| Agent / robotics | Flash tools; Deep Research for async dossiers / ER 2 + bounded Arduino/LeRobot controller |
| Grounding / combination | Search for interactive answers, Exa for controlled evidence / Arduino + ER 2 if hardware readiness passes |
| Gemini over OpenAI / avoid Gemini | Integrated Google grounding or ER/Live wins tests / deterministic code suffices or access/governance fails |
| Preparation / risk / access uncertainty | Tier-1 exercise / quota, preview and state/tool failures / unpublished Junction benefits |
| Capability tiers | Flash 1; Search 1; Live 2; Computer Use 3; Robotics 3; Deep Research 2; Veo 3 |
| Overall | **Tier 1; relevance 9/10; confidence 7/10**—judgment scores, lowered by MCP documentation conflict and unknown partner benefits |

**Five things to remember**

1. Prepare Flash and validated tools before deciding on a specialized model.
2. DeepMind partnership does not promise participant credits or private model access.
3. Live and Robotics earn their place through measured user outcomes.
4. The application authorizes actions, and deterministic controllers execute physical motion.
5. Recheck endpoints, quotas, terms and sponsor benefits before the November demo.

