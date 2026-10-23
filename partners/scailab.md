# Scailab — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed identity and evidence limits

Junction lists **Scailab** as a Tech Partner and links to **scailab.se**. Official indexed descriptions identify perception infrastructure for physical AI, synthetic data and robotics intelligence. The main site returned no readable body through the research browser, and a direct fetch also failed. Public API documentation, supported simulators, downloadable assets, pricing and Junction entitlements were not verified. [Junction](https://2026.hackjunction.com/#partners) · [Official site](https://www.scailab.se/) · [Official mission page](https://www.scailab.se/mission)

This is a completed evidence-limited assessment, not a claim that no tools exist. Do not substitute information about similarly named companies or the Scilab numerical-computing software.

**Assessment:** defer integration until a mentor demonstrates the actual participant package. The useful preparation is understanding how to evaluate synthetic-data benefits, not inventing an SDK.

## Project hypotheses

| Direction | Feasible scope if data is supplied | Success criterion |
|---|---|---|
| Perception robustness report | Compare a model across specified visual conditions | Error rates by condition |
| Synthetic-data coverage audit | Identify missing cases in an approved dataset | Relevant gaps surfaced |
| Real/synthetic comparison | Evaluate a baseline with a controlled augmentation experiment | Improvement on held-out real examples |

These are proposed uses of the stated domain. The reviewed evidence does not confirm that Scailab provides any specific dataset, renderer, model or integration at Junction.

## What to request before choosing

Ask for one working example, exact input/output formats, data licences, supported hardware/software and expected processing time. Request a small downloadable sample and a clear description of what is included in the event offer. If the path depends on an internal demo or unavailable account, do not make it a core dependency.

Clarify the intended task: object detection, segmentation, pose estimation, manipulation perception or something else. These need different labels and metrics. “Synthetic data” is a data-generation category, not a single reusable plug-in.

## Proposed architecture and evaluation

If a package is supplied, retain a manifest linking each sample to its generation conditions and labels. Define train, validation and test partitions before experimentation. Keep similar scenes and variations from leaking across partitions.

Use a simple baseline on the same fixed test set. Evaluate per-condition failure rates rather than only aggregate accuracy. If all test data is synthetic, report synthetic-domain performance; do not call it real-world validation.

A dashboard could let judges inspect failure cases, filter by condition and compare two model configurations. Include false positives and uncertain labels. Store the source sample and prediction together so results can be checked.

## Weekend plan and fallback

One developer owns the data adapter, one evaluation and one the interface. Markus defines the meaningful environmental variation and pitch. If training is required, time-box it and verify compute access first. Prefer a provided pretrained baseline to building a perception stack from scratch.

A fallback can use an openly licensed sample dataset with a generic robustness dashboard, but that would no longer demonstrate Scailab integration. State that distinction and check whether it remains eligible for the chosen challenge.

Qualia may provide task expertise, NVIDIA/Intel a compatible inference path and Wendy a deployment route. None of these combinations is established by the logos alone. Avoid attempting simulation, training, hardware integration and a full application simultaneously.

## Recommendation

**Conditional priority:** valuable if the actual task needs perception data and the sponsor supplies a usable package. Otherwise spend preparation time on better-documented dependencies.

A strong pitch explains one failure mode, a controlled intervention and the measured result. The strongest question for the mentor is: “What can we download or call today, and how should we prove that using it improved our system?” Until that is answered, no claim of integration readiness is justified.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

