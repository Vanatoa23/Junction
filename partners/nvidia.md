# NVIDIA — Junction 2026 partner intelligence

Researched **10 October 2026** for your four-person team and 40 productive hours. Tier 1 = prepare; Tier 2 = conditional; Tier 3 = skip.

## Role and evidence

**CONFIRMED:** [Junction](https://2026.hackjunction.com/) runs 13–15 November in Espoo; advertises 48 hours, Arduino UNO Q boards, LeRobot arms, and hardware mentoring. Tracks remain TBA. These are event resources, not NVIDIA hardware commitments.

**UNKNOWN:** Your brief identifies NVIDIA as Technology Partner, but the retrieved official page does not expose a named NVIDIA listing; independent verification remains incomplete. NVIDIA-specific credits, GPU allocations, NIM entitlements, workshops, mentors, Jetsons, special prizes, and challenge involvement are all unverified.

**INFERENCE:** A Tech Partner may supply APIs/tools; that designation does not establish a challenge or prize. Budget using public access.

## Relevant stack

Difficulty estimates assume no previous deployment experience.

| Tool | Function / use at Junction | Setup |
|---|---|---|
| CUDA | GPU runtime/programming; usually consumed through PyTorch, not custom kernels | Low indirectly; high directly |
| TensorRT / TensorRT-LLM | Optimized vision / language inference; use for measured performance constraints | Medium–high |
| Triton Inference Server | Model serving, batching, multiple backends; useful for concurrent pipelines | Medium |
| NIM | Packaged inference or hosted endpoints; fastest NVIDIA integration | Low hosted; medium self-hosted |
| NeMo | Training/post-training and retrieval ecosystem; prefer individual components | High for training |
| Nemotron | Open models for reasoning, agents, vision and retrieval | Low API; medium local |
| Riva | GPU speech recognition/synthesis; relevant for streaming voice | Medium |
| DeepStream | GPU video ingestion, inference, tracking and metadata | Medium–high |
| Isaac | Simulation, perception and manipulation ecosystem | High |
| Jetson | Edge GPU compute; use only with confirmed compatible hardware | Medium–high |
| Nsight | CPU/GPU profiling; use only after identifying a GPU bottleneck | Medium |

Primary references: [TensorRT-LLM/Triton](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/getting_started/trtllm_user_guide.html), [NeMo](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/index.html), [Nsight](https://developer.nvidia.com/nsight-systems/get-started). Riva remains relevant: [DeepStream documentation](https://developer.nvidia.com/deepstream-sdk) directs speech users to it.

## NIM: prototype first

[NIM](https://developer.nvidia.com/nim) offers public hosted prototyping APIs and downloadable containers using TensorRT, TensorRT-LLM, vLLM or SGLang. Hosted access requires a developer account/API key; self-hosting requires compatible GPUs, drivers, container runtime, storage and NGC credentials. Use model-specific instructions and the [support matrix](https://docs.nvidia.com/nim/large-language-models/latest/reference/support-matrix.html).

[Lightning’s endpoint](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b) uses the OpenAI SDK with `https://integrate.api.nvidia.com/v1`; compatibility covers supported inference operations, not every OpenAI feature. LLM/VLM, embedding, reranking and document models exist; [retrieval endpoints](https://github.com/NVIDIA/NeMo-Retriever/blob/main/docs/docs/extraction/prerequisites-support-matrix.md) have differing contracts.

NVIDIA currently advertises free unlimited prototyping, not guaranteed unlimited throughput. Do not assume historical credit quotas. Production enterprise support/partner endpoints and GPU hosting can cost money; model licences and API trial terms are separate. No Junction allocation or universal token price was verified.

**Prefer NIM** when its exact model or supported container saves integration time, or private deployment matters. Against OpenAI/Gemini, Featherless, or self-run vLLM, measure task quality, availability and total cost first; NVIDIA branding alone supplies no advantage.

## Five Nemotron models worth knowing

1. **3.5 Lightning 30B-A3B:** current fast reasoning, coding, tools and agents; [released August 2026](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b/modelcard). First API experiment; 3B active does not mean 3B storage.
2. **3 Super 120B-A12B:** stronger reasoning candidate; [public release](https://research.nvidia.com/labs/nemotron/projects/), substantial self-hosting footprint. Try hosted.
3. **Nano 9B v2:** smaller reasoning/non-reasoning candidate for constrained deployment; [model card](https://developer.download.nvidia.com/assets/ace/model_card/Nemotron-Nano-9B-V2.pdf).
4. **3 Nano Omni 30B-A3B Reasoning:** multimodal image interpretation; check endpoint access before committing.
5. **3 Embed 1B:** retrieval embeddings; pair with a reranker only if recall improves. Last two appear in the [official integration matrix](https://github.com/NVIDIA/NeMo-Retriever/blob/main/docs/docs/extraction/prerequisites-support-matrix.md).

Public documentation does not guarantee account access. Advantage requires measured accuracy, latency or control.

## Optimization and physical AI

Transformers is simplest for experimental model code; vLLM provides practical batching/serving. TensorRT-LLM targets optimized kernels, quantization and KV-cache management; current PyTorch routes can avoid engine compilation. Triton adds serving; NIM packages backends. Compatibility depends on checkpoint/backend/version. Quantization can reduce weights, while long context and concurrency increase memory. Benchmark p95 latency, throughput and peak memory; no universal speedup is defensible.

Spend hackathon hours optimizing **only when performance determines product success or judging**. Limit switches to two hours.

[DeepStream](https://developer.nvidia.com/deepstream-sdk) supports detector/tracker pipelines, camera streams and industrial analytics. A VLM can explain selected frames; it does not replace reliable detection or defect labels. Conditional usefulness: **Arduino 4/5**, **Valio Aimo 4/5** for logistics/inspection, **Espoo 4/5** for infrastructure streams, **Aalto 3/5** for research perception. These are scenario judgments, not announced challenges.

[Isaac](https://developer.nvidia.com/isaac) includes Sim, ROS perception/navigation and Manipulator. GR00T is publicly documented with [LeRobot integration workflows](https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/11-sim-evaluation.html). Event-arm compatibility remains unknown. Arduino handles control; an external NVIDIA GPU handles perception/policies. In 40 hours, use pretrained perception plus scripted motion; new simulation, calibration and policy training will probably dominate.

## Five strongest combinations

Conditional architectures; require measured benefit.

| Combination | Architecture / justification |
|---|---|
| Verda | [NVIDIA GPU cloud](https://verda.com/) → NIM or vLLM → backend; private/custom GPU workload |
| Modal | [GPU function](https://modal.com/docs/guide/gpu) → detector → app; GPU execution matters, CUDA/Triton management usually does not |
| Arduino | Camera → GPU perception → bounded Arduino action; rapid visual feedback |
| AfterQuery | Tasks → Nemotron → verifier → held-out score; chosen open model enables later post-training |
| Valio Aimo | Camera → DeepStream tracking → operational alert; continuous multi-stream analysis |

[AfterQuery reports](https://www.afterquery.com/blog/how-afterquery-helped-nvidia-hill-climb-gdpval) office-agent data used in Nemotron 3 Ultra SFT/distillation/post-training, with an 11.4-point warmup ablation improvement. Treat this as a vendor-reported result, not a transferable guarantee. Build evaluation first; request dataset access separately.

## Four project seeds

| Problem / capability | 40-hour MVP and live demo | Metric / risk |
|---|---|---|
| Loading-bay delays / DeepStream | Two replayed streams, tracked queues, alert dashboard | Queue error, FPS / occlusion |
| Packaging defects / TensorRT | One product, detector, reject overlay | Defect recall, p95 / scarce labels |
| Sorting aid / GPU perception | Fixed camera, two object classes, scripted arm picks | Successful picks / calibration |
| Unreliable office workflow / Nemotron | Inventory reconciliation, executable checks, before/after runs | Held-out pass rate / verifier loopholes |

## Preparation, risks and verdict

**Definitely prepare:** developer account, NIM key, one Lightning call, schema validation and provider fallback. **Worth preparing:** one GPU inference test; CUDA basics limited to drivers, memory and container compatibility. **Wait for challenge:** TensorRT-LLM, DeepStream, Isaac and Jetson.

**Two-hour exercise:** 20 labelled product images → hosted multimodal NIM → validated JSON → small review app. Hold out five images; target ≥90% schema validity, measure accuracy/p95, demonstrate timeout fallback.

Risks: CUDA/driver conflicts, huge downloads, incompatible checkpoints, unavailable GPUs, licensing/endpoint restrictions, Blackwell-only assumptions and robotics setup. [Modal warns](https://modal.com/docs/guide/gpu) newer hardware needs compatible software; use tested hardware, not prestige. Optimization without judging impact wastes the team's scarce hours.

2025–2026 direction: efficient open agents, Blackwell inference, multimodal retrieval/video and physical AI. Inference from cited releases. Searches found no reliable NVIDIA-specific Junction 2024/2025 Hackerpack, credit, workshop or winning-project precedent. A separate [2024 NVIDIA/LlamaIndex contest](https://developer.download.nvidia.com/licenses/nvidia-and-llamaIndex-developer-contest-terms-conditions.pdf) establishes contest activity, not Junction benefits.

**Ranks:** NVIDIA Tier 2; NIM Tier 1; Nemotron Tier 2; TensorRT Tier 3; DeepStream Tier 2; Isaac Tier 3.

**Architecture-changing capability:** sustained GPU video/perception or private/custom inference with a measured requirement; otherwise keep the normal API architecture.

## Final cheat sheet

Partner: NVIDIA  
Junction role: Tech Partner reported; independently unverified  
Best general capability: GPU inference  
Best AI capability: Hosted NIM  
Best physical-AI capability: Accelerated perception  
Best reason to use: Measurable performance/control  
When not to use: Ordinary API suffices  
Fastest integration: Hosted OpenAI-compatible call  
Best partner combination: Verda  
Best preparation: One NIM evaluation loop  
Preparation tier: Tier 2 overall  
Biggest technical risk: Compatibility/setup  
Hackathon relevance: 7/10, conditional

### Five things to remember

1. Public developer access is not Junction sponsorship credit.
2. Start hosted and retain a fallback.
3. GPU video offers the clearest architectural advantage.
4. Evaluate task outcomes before optimizing speed.
5. Avoid learning robotics infrastructure during the event.



