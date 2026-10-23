# Wendy — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed offering

Wendy is a Tech Partner. Its site presents a platform for physical AI from simulation through deployment and operation, including telemetry, over-the-air updates and fleet tools. Documentation covers a development CLI, target agent, device access, robotics and troubleshooting. This is a deployment/operation layer, not automatically a robot's learned policy. [Junction](https://2026.hackjunction.com/#partners) · [Product](https://wendy.dev/) · [Quickstart](https://docs.wendy.dev/latest/)

**Assessment:** potentially useful for making a physical demo observable and repeatable. For a software-heavy team, a simulator-first path can reduce hardware waiting, but simulated success does not establish real-device success. Confirm the exact supported target and requirements.

## Product hypotheses

| Direction | Smallest convincing demo | Evaluation |
|---|---|---|
| Device incident viewer | A failed device task exposes useful telemetry and a recovery step | Diagnosis time and correct cause |
| Sim-to-device workflow | One supported application runs in simulation and on hardware | Behavioral differences and deployment success |
| Bounded fleet operation | Send a safe task to a small simulated set and observe results | Completion and failure reporting |

These are possible builds, not the unpublished Junction challenge. Avoid a drone swarm or complex robot autonomy project unless the sponsor provides a working environment and experienced support.

## Integration design

The docs distinguish software installed on the development machine from the target-side agent. Verify operating-system support and device permissions before planning camera, microphone or accelerator use. A CLI installation alone does not prove that the hardware is reachable or compatible.

Start with the documented sample. Record device identity, application version, task ID and logs. Display current state and last-contact time in the UI. A disconnected device should appear as unknown/offline rather than continuing to show its last state as live.

Separate high-level commands from low-level control. Use the supported control stack, bounded actions and an accessible stop mechanism for a physical demonstration. An LLM-generated task explanation should not override controller limits.

## Execution and measurement

One developer handles runtime/target setup, one task state and telemetry, one the user interface. Markus defines the task and failure cases. Get deployment and logs working before model intelligence. A reliable “task failed here, for this reason” view can be more valuable than another unobservable autonomous loop.

Test startup, interruption, reconnect and repeated execution. Record what happens if a command is submitted twice. Measure time to deploy or diagnose using a fixed procedure, rather than relying on a one-off successful video.

Keep a clearly marked recorded fallback for the pitch. If a simulator is used, show the simulator label. Do not imply the team deployed on physical equipment when only the simulated path ran.

## Preparation and combinations

Read the quickstart, hardware overview and troubleshooting links. Practise installation on an appropriate spare/development environment only when needed; this research did not install Wendy or access devices.

Qualia could supply manipulation expertise, Scailab perception assets, Arduino physical inputs and Intel/NVIDIA compute. Each boundary needs compatibility confirmation. Choose one target and one runtime; using several physical-AI partners does not automatically make the result better.

## Mentor questions and gate

Ask which devices are present, whether access is exclusive or shared, whether the relevant simulator runs on team laptops, which accounts and network access are needed, and what permissions the agent requires. Confirm pricing, telemetry retention and post-event shutdown behavior.

**Go:** a working official sample on an available target and an application where operation matters. **No-go:** device setup consumes the first evening with no observable path. In that case, a web-only simulation may preserve the idea, but check eligibility.

**Pitch:** show the user's task, the actual target, its result and a recoverable failure. The value is reliable physical execution and visibility, not simply an agent issuing commands.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

