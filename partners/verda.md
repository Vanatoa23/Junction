# Verda — Junction 2026 operational intelligence

Research date: **8 October 2026**. For Markus and three full-stack developers. **CONFIRMED** denotes a public source; **INFERENCE** denotes our interpretation; **SPECULATION** denotes an unannounced challenge hypothesis. Product listings do not establish live capacity or our account entitlement. This condenses the supplied 42-part brief into a weekend decision guide.

## Recommendation and event status

**Default: commercial APIs for reasoning, with Verda only for a specialized vision, embedding, evaluation or open-model workload that benefits measurably from GPU access.** Prepare one deployment-and-teardown exercise; defer clusters and fine-tuning until the challenge justifies them.

**CONFIRMED:** [Junction 2026](https://2026.hackjunction.com/) lists Verda under Main Partners and advertises 13–15 November, Hype Areena, Espoo, and 48 hours of building. Plan around roughly 40 usable engineering hours. **Not publicly verified:** Verda's challenge statement, credit amount, expiry, team limits, eligible services, reserved GPUs, workshops and mentor arrangements. Main Partner placement alone does not settle these questions.

[Verda's November 2025 digest](https://verda.com/blog/verda-monthly-digest-november-edition) confirms credits supported Junction and an Aalto Agentic AI Hackathon; it says a winning Junction team used credits, but does not identify that project. This supports an infrastructure role, not an assumed 2026 credit package or judging rubric.

## Identity and platform

The [rename announcement](https://verda.click/blog/datacrunch-is-changing-its-name-to-verda) scheduled communications migration for **17 November 2025**, describing continuity of services and vision rather than an ownership change.

| Historical | Current reference | Reuse policy |
|---|---|---|
| DataCrunch; datacrunch.io | Verda; verda.com | Historical event evidence remains useful |
| Old API/domain examples | [Public API v1](https://api.verda.com/v1/docs) | Verify authentication, fields and scopes |
| Legacy SDK/tutorial names | [verda-cloud/sdk-python](https://github.com/verda-cloud/sdk-python) | Check imports and supported resources; do not blindly rename |
| Handwritten provisioning scripts | Verda CLI; official Terraform/OpenTofu provider | Prefer current documented interfaces |

[Current documentation](https://docs.verda.com/) covers CPU/GPU VMs, spot, Instant Clusters, serverless endpoints/jobs, block volumes, shared filesystems and container registry. CLI documentation also describes S3-compatible object-storage operations; account availability, regions and pricing need checking. Containers documentation still labels registry “coming soon,” whereas newer platform/CLI pages list it: verify in the console.

| Deployment | Appropriate weekend workload | Main overhead |
|---|---|---|
| Single GPU VM | Persistent inference; SSH debugging; custom runtime | Security, process supervision, idle billing |
| Serverless endpoint | OCI container with HTTP inference and variable demand | Cold starts, health checks, scaling configuration |
| Serverless job | Finite evaluation, embeddings, media processing | Durable outputs, retries, completion handling |
| Instant Cluster | Proven distributed workload | Scheduling, networking, storage, multiplied burn |

Clusters provide multi-node infrastructure; InfiniBand is relevant across nodes and NVLink within supported GPU configurations. Neither automatically speeds up an unmodified single-GPU application. Kubernetes/Slurm are preparation distractions unless already familiar.

## GPU choice and money

Selected [EUR list prices](https://verda.com/pricing?currency=eur), observed on the research date; location, tax treatment and actual account quote must be checked. GPU hours below are **budget/rate calculations**, excluding storage and other charges, not promised credits.

| VM GPU | VRAM | On-demand €/h | Spot €/h | Hours for €20 / €50 / €100 |
|---|---:|---:|---:|---:|
| RTX A6000 | 48 GB | 0.5987 | 0.2994 | 33.4 / 83.5 / 167.0 |
| A100 | 80 GB | 1.63 | 0.8125 | 12.3 / 30.7 / 61.3 |
| H100 | 80 GB | 3.38 | 1.69 | 5.9 / 14.8 / 29.6 |
| H200 | 141 GB | 4.41 | 2.21 | 4.5 / 11.3 / 22.7 |
| B200 | 180 GB | 6.38 | 3.19 | 3.1 / 7.8 / 15.7 |

Recommendation: **A6000 for inexpensive compatible experiments; A100 80 GB for memory headroom.** H100/H200/Blackwell require a measured runtime or capacity advantage. Weight memory is only the starting point: leave room for activations and KV cache. The inexpensive V100 has an older architecture; check runtime support before choosing it.

Serverless L40S is listed at €1.54/h and H100 at €3.72/h; €50 buys approximately 32.5 or 13.4 active replica-hours respectively. Storage is listed at €0.1744/GiB-month. Cluster prices are per GPU: multiply by allocation.

**Billing ambiguity:** [containers docs](https://docs.verda.com/containers/overview/) say used minutes, including startup/shutdown, aggregated in ten-minute bill displays; [product copy](https://verda.click/serverless-containers) describes ten-minute intervals. Confirm rounding before estimating short-job costs. Precise VM billing increments were not established here.

[Billing docs](https://docs.verda.com/welcome-to-verda/pricing-and-billing/) confirm prepaid balances, optional auto-top-up and event coupons; depleted balances can endanger instances/volumes. Coupon terms remain event-specific. [Quotas](https://docs.verda.com/welcome-to-verda/quotas/) cover GPUs, spot GPUs, vCPUs, storage and projects. Quota and available inventory are separate checks.

**Team policy:** one infrastructure owner; initially one GPU and one replica; proposed ceiling €4/hour and €30 for preparation; cost checks every two hours; external shutdown deadline; outputs copied elsewhere. Disable automatic top-up unless intentionally budgeted. Shutdown is not proof that storage costs disappeared. Verify volumes, replicas, jobs and registry retention during teardown.

Spot suits restartable batch work and checkpointed LoRA experiments. Avoid it for the judging endpoint. [API changes](https://docs.verda.com/welcome-to-verda/release-notes/verda-api-changes/) document explicit spot-volume policies: retain detached, move to trash or permanently delete. Never assume weights/checkpoints survive eviction.

## CLI, agents and API

[CLI](https://docs.verda.com/cli/) offers Windows binaries/Scoop, macOS and Linux installation, credentials, SSH, VM/storage operations and diagnostics. Its breadth makes it worth learning; documentation alone does not establish reliability under our workload.

```bash
verda auth login
verda doctor
verda instance-types --gpu
verda availability --location FIN-01
# Replace TYPE with an available, approved configuration:
verda cost estimate --type TYPE
verda vm create                 # interactive selection
verda ssh gpu-runner            # use the actual chosen hostname
verda cost running
verda cost balance
verda vm action --id VM_ID --action shutdown --yes
verda status -o json
```

[Cost commands](https://docs.verda.com/cli/cost-and-status/) expose burn and balance. Confirm installed-version help before mutations. The example does not delete residual storage.

[Beta MCP](https://docs.verda.com/cli/mcp/) starts with `verda mcp serve`, shares CLI credentials and documents Claude Code/Cursor configurations. Its 18 tools cover discovery, VM lifecycle, cost estimates/balance/running costs, SSH and volumes. Other MCP clients require configuration testing; do not confuse skill support with verified MCP compatibility.

[Bundled skills](https://docs.verda.com/cli/skills/) explicitly support Claude Code, Codex, Gemini CLI, Cursor, Windsurf and Copilot. `verda --agent` returns structured output without prompts. This can accelerate deployment but removes interactive friction: **our policy**, not a claimed provider guarantee, is human-approved creation, fixed instance allowlists, no clusters, bounded replicas and an independent timeout. Scope `cloud-api-v1` is not evidence of a granular read-only credential.

The [REST API](https://api.verda.com/v1/docs) uses OAuth client credentials and documented public endpoints. Prefer CLI/SDK over writing authentication plumbing. Preparation estimates:

| Action | Estimated integration effort |
|---|---|
| Discover locations/types/availability; inspect balance | 15 minutes after authentication |
| Create VM, register SSH key, start/shutdown/delete | About one hour |
| Volumes and startup scripts | About one hour |
| Container deployment/job dispatch | Several hours for a first working workload |
| Audit logs (`GET /v1/audit/log`) | About one hour; admin/owner restrictions |
| Clusters; direct quota automation | Unnecessary by default |

These are team planning estimates, not service guarantees.

## Runtime, evaluation and alternatives

Use **weights → pinned GPU container → inference server → authenticated backend → frontend**. [Verda's vLLM quickstart](https://docs.verda.com/containers/tutorials/deploy-with-vllm-quick/) is the default LLM route: explicit image tag, port 8000, `/health`, model license/access check and a real inference request. Check image CUDA requirements against provider drivers. TGI/SGLang are alternatives when a model requires them; plain Transformers is suitable for small specialized jobs. llama.cpp fits modest quantized/local experiments; TensorRT-LLM/Triton are worthwhile only with prior familiarity and a benchmark justification. NVIDIA provides the hardware/software ecosystem; Verda provides cloud access. Add CUDA/NCCL/Nsight or NVIDIA serving tools only when the workload needs them.

Prefer evaluation over training: run 100 cases first, save predictions and score correctness, p50/p95 latency, time to first token and cost per successful task. Compare API versus open model, two quantizations, cold versus warm deployment, then two GPUs only if needed. Keep identical task sets and distinguish end-to-end latency from model time. GPU utilization diagnoses waste; it is not customer value.

LoRA/QLoRA may help repeated domain behavior with a clean dataset; prompting, retrieval and tools should establish the baseline first. Reserve a few-hour experiment on one appropriately sized GPU, not a claimed training-time estimate. Full fine-tuning or preference tuning is a poor default without data, experience and evaluation.

| Alternative | Decision |
|---|---|
| [Modal](https://modal.com/docs/guide) | Python-first managed functions, per-second execution; often faster for batch/serverless code. It also supports clusters: the difference is abstraction, not absence of capability |
| [Featherless](https://featherless.ai/) | Hosted open-model API reduces operations; use an app-eligible plan, since its Chat plan excludes app traffic/benchmarking |
| AWS/GCP/Azure | Prefer existing team expertise/accounts; comparative weekend setup speed was not benchmarked |
| Commercial model API | Best when custom weights, runtime control or GPU-specific workloads add no measurable benefit |

Decision sequence: need custom runtime? If no, API. Need GPU? If no, CPU/local. Finite work? Job. Interactive work? Endpoint; VM if custom control dominates. Exceed one GPU? Optimize model/context first, then consider distributed execution.

## Sovereignty, sustainability and challenge hypotheses

[Location documentation](https://docs.verda.com/welcome-to-verda/locations-and-sustainability) reports Finnish sites FIN-01/02/03, renewable electricity and PUE 1.2/1.3/1.2. These are **provider-reported site metrics**, not measured workload emissions. No workload-level carbon measurement was established. Residency matters only if inputs, logs, backups and external API calls stay within the intended boundary; European hosting alone does not establish application GDPR compliance.

[Confidential computing](https://docs.verda.com/cpu-and-gpu-instances/confidential-computing/) lists RTX PRO 6000/B200/B300 and CPU/GPU memory protection through hardware isolation. It addresses infrastructure-operator access, not insecure application code. A credible privacy demo needs attestation and key handling; defer unless mentors and a tested path are available. Performance overhead was not established.

[AI Lab direction](https://verda.com/ai-lab) emphasizes inference efficiency, hardware-aware optimization and agent infrastructure. Engineering lessons **inferred**: benchmark end-to-end; optimize quality per budget; match runtime to hardware; make experiments reproducible; measure reliability alongside speed. Roadmap announcements do not prove deployable Rubin capacity.

All following are **SPECULATION**, with qualitative likelihood conditional on Verda owning a challenge:

| Theme | Likelihood | Feasible demo / metric |
|---|---|---|
| Efficient open-model application | High | Task-specific model; accuracy at fixed cost |
| Evaluation-driven model selection | High | Batch leaderboard; cost per correct result |
| Bounded infrastructure agent | Medium | Provision/test/tear down; budget violations |
| Sovereign document processing | Medium | Local VLM extraction; field accuracy |
| Multimodal batch pipeline | Medium | Vision/audio processing; turnaround time |
| Confidential inference | Low–medium | Attested synthetic-data workflow; verified isolation |

Likely judge appeal is an inference: a useful GPU workload with measurable product benefit and reproducible deployment. Idle H100s, generic chatbots and unexplained multi-node infrastructure provide weak evidence of innovation.

## Project seeds and partner combinations

These are conditional combinations, not confirmed datasets, integrations or challenge permissions.

| User/problem | GPU layer and partner | Weekend MVP / metric | Main risk |
|---|---|---|---|
| Municipal accessibility analyst | Espoo imagery → Verda vision | Map verified obstacles; precision | Dataset rights |
| Food-service planner | Valio Aimo → batch forecasting | Demand/waste scenarios; forecast error | Data access |
| Document reviewer | Aalto/enterprise docs → VLM endpoint | Cited extraction; field accuracy | Layout failures |
| ML team choosing a model | AfterQuery-style cases → jobs | Model leaderboard; cost/correct case | Unverified benchmark |
| Robotics operator | Arduino camera → vision VM | Detect event; bounded action; latency | Network safety |
| Media editor | Cloudinary assets → GPU model | Search/segment clips; relevance | Upload overhead |
| Evidence researcher | Exa retrieval → open reranker | Ranked source trail; retrieval accuracy | GPU adds little |

OpenAI/DeepMind APIs can handle reasoning around specialized GPU outputs; Hostinger can serve the web layer. Cala AI and other tools require capability verification before assigning an architectural role.

## Team preparation and cheat sheet

Strategy A, APIs only: fastest, lowest operations. B, one open model: more control with serving risk. **C, API reasoning plus specialized GPU work: strongest conditional default.** D, fine-tune/deploy: highest dataset and schedule risk. Markus owns task cases, cost/quality analysis and pitch; developers own frontend, integration and runtime, with one named billing owner.

**Before Junction:** account/MFA, project/billing owner, quota check, CLI/authentication, SSH keys, Docker familiarity, model license, registry access and fallback. Claim credits only when eligibility is verified. Defer Terraform, clusters and MCP write access unless the practice exercise needs them.

**2–4-hour exercise:** deploy the quickstart small model on real infrastructure, call it from a tiny client, evaluate 20 synthetic cases, record cold/warm latency and cost, deliberately restart, then delete resources. Success: reproducible setup, successful post-restart inference, saved results, no remaining billable resources. This report does not claim the exercise was executed.

**If choosing GPU-heavy work:** check inventory, disk/model download size, runtime/driver compatibility, VRAM/context/concurrency, endpoint authentication, logs, health plus inference, replica cap, durable outputs, spot retention, cost alerts, teardown and cached/API fallback. Timebox infrastructure troubleshooting to 60–90 minutes; installation and download failures can consume the weekend.

**Cheat sheet:** Verda, formerly DataCrunch; confirmed Main Partner; AI cloud for controlled GPU workloads. Ordinary experimentation: compatible A6000/A100. Interface: CLI; interesting agent feature: beta MCP plus bundled skills. Best combination: useful partner data plus specialized GPU processing. Biggest financial risk: forgotten replicas/volumes; technical risk: runtime compatibility and cold starts; uncertainty: challenge and credits. Subjective relevance **8/10**; platform understanding **7/10**, event specifics **3/10**.

Five things to remember:

1. Earn the GPU layer with a measurable task benefit.
2. Start with one model, one GPU and a working fallback.
3. Credits, quota and capacity are separate questions.
4. Benchmark quality, latency and cost together.
5. Teardown includes storage and replicas, not just the VM.
