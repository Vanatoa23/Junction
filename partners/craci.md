# CRACI — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed product and role

CRACI is listed as a Tech Partner. Its website describes secure build runners, build-time software bills of materials (SBOMs), vulnerability monitoring and response. It illustrates connecting a dependency finding to a build, artifact and fix. Those on-page examples are demonstrations, not measured results for our repository. [Junction](https://2026.hackjunction.com/#partners) · [CRACI](https://craci.com/)

**Assessment:** use it when software provenance or release security is genuinely part of the challenge, or when setup is easy enough to improve our own pipeline. Do not let CI experimentation delay a working user demo. No participant runner quota or private-repository entitlement was verified.

## What makes the capability useful?

An application is built from more than the top-level dependency list. A useful provenance workflow should identify the actual released artifact and its component versions, then preserve enough information to revisit it when a new issue appears. This is our engineering objective; check which evidence CRACI actually exposes to participants.

Do not equate an SBOM with a security audit or claim that no findings means no vulnerabilities. The component inventory and the quality of vulnerability matching are separate questions. A result can require human assessment before a change is appropriate.

## Project hypotheses

| Direction | Narrow demo | Evaluation |
|---|---|---|
| Release-impact explorer | Trace a sample advisory to an affected artifact and owner | Correct mappings and missed affected releases |
| Build evidence viewer | Compare a manifest with actual supplied build evidence | Useful additional components found |
| Fix-validation workflow | Proposed dependency update passes relevant checks before approval | Reproduction fixed and regressions avoided |

Use a deliberately isolated sample application or sponsor fixtures. There is no need to exploit a real system. A convincing demonstration can show a known affected dependency, its provenance, an upgrade and a validation result.

## Integration design

First get the existing application building on a known runner. Then try the documented partner path if access is available. Preserve a fallback workflow. Keep credentials in the CI secret store and grant only required repository permissions.

Store build ID, commit, artifact identifier, component versions and evidence links. If designing a vulnerability triage app, distinguish affected, unaffected and insufficient-information outcomes. Link each conclusion to its evidence instead of returning a bare severity score.

A language model can summarize a finding or draft a change, but should not automatically merge a patch merely because a scanner suggested it. Validate the original failure condition and the application behavior after the update.

## Evaluation and team split

Measure successful build completion, inventory coverage against a known fixture, correct advisory-to-artifact mapping and time to produce a reviewable fix. Include a case that looks relevant but is not established as affected. Report build overhead if the tool adds it.

One developer handles CI/runner integration, one the evidence and triage backend, one the interface. Markus defines the practical risk workflow and pitch. A small evidence table can be more effective than an elaborate security dashboard.

## Preparation, unknowns and gate

Read the current onboarding and ask whether runner installation requires an organization administrator, what repository permissions are needed, which package ecosystems are supported, what can be exported and what survives after event credits expire. Do not assume a public marketing demo implies API access.

Prepare a normal CI pipeline and a reproducible sample dependency tree. Avoid making broad Cyber Resilience Act compliance claims: this report is about technical evidence, not a legal determination.

Codex can assist in producing a reviewable patch; CRACI-style provenance can explain why a patch matters. That is a plausible combination, not a confirmed event prize category.

**Go:** setup is quick or the challenge is directly about supply-chain evidence. **No-go:** permissions and runner compatibility block the core product. **Pitch:** trace one real sample finding through release evidence, human review and a validated fix.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

