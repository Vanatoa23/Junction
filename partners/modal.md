# Junction 2026 Partner Intelligence — Modal

> **Roster update — 24 October 2026:** independently confirmed in the official page's partner section as **Tech**. This update supersedes earlier uncertainty about the listing/tier below. The original product research date remains as stated; API versions, prices and access in the older report have not all been re-tested or re-researched. Challenge briefs remain TBA. [Current coverage and source record](README.md).

As of **10 October 2026**. Recommendations, timings and ratings are **INFERENCE**.

## 1. Junction role

**CONFIRMED:** Junction describes its Tech Partner category as supplying platforms/APIs/tools; challenge tracks remain TBA. **UNKNOWN:** independent confirmation of Modal’s exact listing: your brief says “Technology Partner,” but the [official page](https://2026.hackjunction.com/) text extraction omits many partner logos. Modal-specific participant credits, workshops, mentors, Hackerpack benefits, prizes, redemption/expiry and usage restrictions are unverified. **INFERENCE:** useful compute access is plausible; budget without event credits.

## 2. What it provides

[Modal](https://modal.com/docs/guide) runs serverless Python CPU/GPU functions, HTTP endpoints, parallel batch jobs and scheduled jobs. [Images](https://modal.com/docs/guide/images) encode dependencies or import containers; [Secrets](https://modal.com/docs/guide/secrets) inject credentials. [Volumes](https://modal.com/docs/guide/volumes) persist weights/results; [bucket mounts](https://modal.com/docs/guide/cloud-bucket-mounts) connect external object storage. [Sandboxes](https://modal.com/docs/guide/sandboxes) isolate generated code. Functions autoscale; warm containers support continuously available services, but deployment does not guarantee permanent process state. Removes VM provisioning, drivers, routing and scaling; you handle model compatibility.

## 3. Fastest workflow

Estimate **one hour**; 15 minutes for copied examples, several hours/risky for unfamiliar CUDA or large models. Install `modal`, authenticate with `modal setup`, edit locally, define a Python function and pinned Image, select `gpu="L4"`, attach named Secrets, test with `modal run app.py`, add `@modal.fastapi_endpoint(method="POST")`, then `modal deploy app.py`. Call its URL, inspect dashboard or `modal app logs APP`, then `modal app stop APP`. `modal serve app.py` supports live development; execution remains remote. [Workflow](https://modal.com/docs/guide/developing-debugging), [HTTP](https://modal.com/docs/guide/webhooks), [CLI](https://modal.com/docs/cli/latest/app).

## 4. GPU workloads

| Workload | Fit and decision |
|---|---|
| VLM inference | Good: custom vision model/pipeline |
| Embeddings | Good in bulk; overkill for a few texts |
| Image/video processing | Good for GPU-heavy transforms |
| Open-model inference | Good when hosted API lacks required control |
| LoRA fine-tuning | Possible with prepared data and recipe |
| Batch evaluation | Good: parallel, bounded experiments |
| Synthetic data | Good for custom generation; API otherwise |
| OCR/CV | Good for specialized models; simple OCR may need CPU only |

[GPU options](https://modal.com/docs/guide/gpu) and [examples](https://modal.com/docs/examples) support these patterns; GPUs require payment details.

## 5. Modal versus Verda

| Dimension | Modal | Verda |
|---|---|---|
| Setup | Python decorators | VM setup or container deployment |
| GPU choice | Per-function type | Instance/container hardware |
| Persistence | Warm containers + Volumes | Persistent VMs/storage |
| Batch/autoscaling | Built in | Batch and serverless scaling also available |
| SSH/control | Managed runtime/debug shell | SSH and OS control on VMs |
| Custom runtime | Images, platform constraints | VM flexibility or custom containers |
| Cost visibility | Seconds plus resources | VM hourly rates; container minute billing |
| Operations | Lower for Python jobs | More for VMs; managed containers reduce burden |

Choose Modal for bursty Python workloads and rapid iteration; Verda for OS control or sustained instance work. Verda is **also serverless**. [Containers](https://docs.verda.com/containers/overview/), [SSH](https://docs.verda.com/cpu-and-gpu-instances/creating-an-ssh-key/), [prices](https://verda.com/pricing).

## 6. Modal versus Featherless

[Featherless](https://featherless.ai/docs/plans) supplies hosted models through an API; use its Developer plan for app traffic. Choose Modal for custom weights, preprocessing, adapters, GPU code or evaluation internals; APIs for ordinary chat.

## 7. Normal hosting and hybrid

Recommended: Vercel frontend → Railway/Render backend/database → authenticated Modal compute; object storage for media. Hostinger/regular hosting can replace the app hosts. Keep auth/CRUD there. Ordinary background work already fits [Render workers](https://render.com/docs/background-workers); Modal should own specialized compute.

## 8. Reliable inference

Frontend/backend → Modal endpoint → GPU model → result. Load weights once per container; cache downloads in a Volume and results by input/model version. Cap containers and start with one input per GPU to avoid OOM; increase concurrency after measurement. Use [streaming](https://modal.com/docs/guide/streaming-endpoints) where useful; long jobs return IDs for polling. HTTP handling has a [150-second limit/redirect mechanism](https://modal.com/docs/guide/webhook-timeouts). For the demo, prewarm one container, test representative inputs, temporarily keep `min_containers=1`, and retain a clearly labelled cached result/API fallback. Restore zero minimum afterward. [Cold starts](https://modal.com/docs/guide/cold-start).

## 9. Batch and evaluation

Dataset → `.map()` parallel workers → predictions → CPU evaluator → persisted results. Compare models/prompts; process images/generate data with fixed datasets/seeds and bounded retries. [Batch processing](https://modal.com/docs/guide/batch-processing) generally buys better pitch evidence than training, unless adaptation solves the challenge.

## 10. Pricing and controls

[Current USD rates](https://modal.com/pricing): GPU-only hourly equivalents: T4 $0.5904; L4 $0.7992; A10 $1.1016; L40S $1.9512; A100 40/80GB $2.0988/$2.4984; H100 $3.9492; H200 $4.5396; RTX PRO 6000 $3.0312; B200 $6.2496; B300 $7.0992. Functions: CPU $0.04716/physical-core-hour; memory $0.007992/GiB-hour. Sandbox CPU/memory cost about 3×. Volumes: $0.09/GiB-month beyond included 1 TiB; egress $0.04/GiB beyond Starter’s 1 TiB. External storage bills separately.

Starter includes $30 monthly compute, three seats and ten concurrent GPUs; Use three developer accounts. Billing is per second, including loading and warm idle time. Shared Endpoints tokens are excluded from free compute since September 2026. Junction credits: unknown.

Illustration only, **€1=$1**, excluding FX/tax/credits: L4 + one core + 4GiB costs ~$0.88/hour; €10/€50/€100 buys ~11/57/114 hours of inference/evaluation, not guaranteed throughput. Set [budget](https://modal.com/docs/guide/budgets), max two GPUs across apps, finite timeouts/retries, authenticated endpoints and hourly usage checks. Stop deployments/schedules and terminate sandboxes; default to scale-to-zero.

## 11. Direction, 2025–2026

[2025 updates](https://modal.com/blog/modal-product-updates-apr-2025) expanded batch queues; [Sandboxes became GA](https://modal.com/blog/sandbox-launch). Direction: serving, agents, evaluation and [distributed clusters](https://modal.com/docs/guide/multi-node-clusters). [October changelog](https://modal.com/changelog): VM Sandboxes, Python SDK 1.6.0, improved dashboards; Sidecars remain **Beta**. Use current APIs, not deprecated pre-1.0 examples: [migration guide](https://modal.com/docs/guide/modal-1-0-migration).

## 12. Hackathon evidence

No substantiated Junction 2024/2025 Modal evidence found. Elsewhere, [August 2025 AI Agent & Infra](https://ai-agent-infra.devpost.com/) offered accepted Modal-track participants $500 credits and sponsor prizes. [HackIllinois 2026](https://hackillinois-2026.devpost.com/) advertised $250 credits; [KTH organizers](https://www.linkedin.com/posts/kthaisociety_hackathon-aihackathon-modallabs-activity-7315320148607799297-Ttou) reported CLAP audio-search and YOLO drowsiness winners. No Junction entitlement follows.

## 13. Five combinations

Proposals: Cloudinary media → custom Modal VLM; Exa retrieval → custom reranker; AfterQuery evaluation set → parallel scoring; Arduino camera → heavier vision than edge hardware permits; Valio data → custom forecasting batches/service. Use only when APIs/CPU cannot suffice.

## 14. Challenge usefulness

Provisional: **Aalto Medium**—research/evaluation if compute-intensive; **Arduino High**—remote vision; **Espoo Medium**—bulk geospatial/document analysis; **Valio Aimo High**—forecasting/optimization; **Hostinger Low**—ordinary hosting usually suffices; **Exa/Cala Medium**—custom reranking/evaluation. Briefs unavailable.

## 15. Preparation

**Definitely:** account, SDK/CLI, CPU function, HTTP endpoint, Secrets and teardown. **Worth:** one GPU function, Volume, batch job and cold-start test. **Wait for challenge:** large-model serving or fine-tuning. Minimum: one developer exercises and shares the template.

## 16. Two-hour exercise

Deploy a small image-embedding model on L4 with pinned dependencies, Volume and authenticated POST. Send 20 images: one cold, repeated warm, then concurrency. Record cold/warm latency, failures and dashboard spend against $0.88/hour. Stop the app, remove schedules, terminate sandboxes and verify zero active containers; delete disposable storage. Success: working endpoint, measured latency/cost, zero running resources.

## 17. Risks

Cold starts/downloads, CUDA conflicts, GPU shortages, OOM, unsafe concurrency and timeouts can derail demos. Pin model/package versions, predownload, test memory and an alternate GPU. Runaway calls/retries/warm containers burn money; enforce caps. Use a normal API when custom compute adds no product value.

## 18. Verdict

**Tier 2, 8/10:** prepare a template in the generic toolkit; activate compute when needed. Preserve time for integration/evaluation/pitch.

## 19. Cheat sheet

Partner: Modal  
Junction role: Technology Partner reported; independently unverified  
Fundamental capability: elastic Python/GPU compute  
Best reason to use: custom computation fast  
When not to use: standard hosted model suffices  
Fastest deployment: Python decorator → `modal deploy`  
Best GPU use: custom vision inference  
Best batch use: model/prompt evaluation  
Best alternative: Featherless API; Verda for VM control  
Best partner combination: Arduino vision  
Best preparation: measured endpoint exercise  
Preparation tier: Tier 2  
Biggest technical risk: model cold start  
Biggest cost risk: uncontrolled GPU concurrency  
Hackathon relevance: 8/10

### Five things to remember

1. Compute must earn its integration time.
2. Measure cold starts before pitching.
3. Evaluation often beats weekend training.
4. Warm GPUs remain billable.
5. Event credits need explicit confirmation.

**Friday-night trigger:** reach immediately for Modal when a differentiated feature needs custom GPU inference or many independent Python evaluation jobs that an ordinary API cannot deliver.
