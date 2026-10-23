# Qualia — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Identity and available evidence

Junction's Tech Partner link points to **qualiastudios.dev**. Qualia describes a robotics workflow spanning operator demonstrations, foundation-model fine-tuning, deployment and subsequent improvement. Its examples include manipulation and sorting. This is physical-AI capability, not a general-purpose text-model API. [Junction](https://2026.hackjunction.com/#partners) · [Qualia](https://qualiastudios.dev/)

The public presentation emphasizes industrial projects and feasibility work. No self-service SDK, model download, Junction robot allocation or participant API was established from the reviewed page. Vendor performance and rollout claims were not independently tested.

**Assessment:** consider Qualia a specialist mentor/integration opportunity until the actual technical package is demonstrated. For our software-heavy team, evaluation or demonstration-data tooling is a safer starting point than learning robot-control infrastructure from scratch.

## Project hypotheses

| Direction | Weekend deliverable | Metric |
|---|---|---|
| Demonstration quality review | Inspect recordings and flag missing/poor task coverage | Defects detected and reviewer agreement |
| Robot task evaluation | Replay trials and compare outcomes across conditions | Success rate with explicit failure categories |
| Narrow assisted manipulation | One supported robot executes one constrained task | Repeated success, interventions and recovery |

These are ideas, not confirmed challenges or Qualia APIs. The physical option requires a working sponsor-supported baseline, compatible hardware and someone who can supervise setup. “Train a general robot” is outside a defensible weekend scope.

## Data and architecture

Represent each trial with task, robot configuration, environment, input recording, action sequence if available, result and reviewer notes. Preserve failed trials. A benchmark that excludes unsuccessful attempts cannot support a reliability claim.

For a data-review tool, start with sponsor-approved recorded demonstrations. Show synchronized views if multiple camera streams are provided, but do not assume such data exists. Allow a human reviewer to label a specific problem and link it to a frame or interval.

For a physical demo, keep language-level task selection separate from the low-level control loop. Use the supplied controller and documented limits. Ensure a human can stop the system. Do not give a generative model unrestricted direct actuator commands.

## Evaluation and execution

Choose one task with clear success and failure criteria. Test variations that matter: object position, occlusion, lighting or a changed object, depending on the actual setup. Count interventions and reset time alongside successful completion.

One developer handles the supplied data/control adapter, one evaluation/storage and one the interface. Markus defines the task and reporting. Establish a recorded fallback before adding live complexity. If no supported example works early, pivot to an offline evaluation workflow rather than spending the weekend on drivers.

A strong pitch includes several trials and a failure explanation. Avoid equating a short successful demonstration with industrial readiness. Show what the system knows about its own limits.

## Preparation and mentor questions

Learn the difference between demonstrations, policy execution and evaluation. Prepare a generic trial log and a proposed labeling rubric. Defer model training, custom grippers and production-style reinforcement learning until the sponsor provides an unusually complete path.

Ask for exact robot models, camera configuration, controller, supported software, sample data, licences, compute access and expected deliverable. Confirm whether Qualia is offering mentoring, tools, hardware or some combination.

Arduino's event Hardware Lab is independently advertised, but that does not guarantee Qualia compatibility or exclusive access. Wendy may help with deployment, NVIDIA/Verda/Modal with compute and Scailab with perception data if actual access is established. Choose only the parts needed for one task.

**Go:** a working baseline, available equipment/data and a measurable narrow objective. **No-go:** missing hardware access or no credible evaluation. **Pitch:** a reliable improvement in one manipulation/data workflow, with the boundary between simulation and physical execution explicit.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

