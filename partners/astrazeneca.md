# AstraZeneca — Junction 2026 partner intelligence

**Research date: 24 October 2026.** Prepared for Markus (research, AI/data architecture, product and pitch) and three full-stack developers.

Evidence convention: **Confirmed** means a cited primary source supports the statement; vendor claims are not independent benchmarks. **Assessment** means our recommendation. **Project hypotheses** are ideas, not announced challenges. Documentation was reviewed; no authenticated API, paid account or hardware integration was tested.

## Confirmed role and research direction

AstraZeneca appears under Challenge Partners on Junction's official roster. Its 2026 problem, business unit, data release and judging criteria remain unverified. [Junction](https://2026.hackjunction.com/#partners)

The company's R&D material describes AI applications in target identification, molecule prioritization, candidate-property prediction, productivity and trial matching. Its Open Innovation programme describes collaboration opportunities, including compounds and research resources; that programme is not an instantly accessible hackathon dataset or API. [AI and data](https://www.astrazeneca.com/r-d/science-and-technologies/ai-data.html) · [Open Innovation](https://openinnovation.astrazeneca.com/)

**Assessment:** prioritize a narrow research or operational workflow with inspectable evidence. Without specialist labels and evaluation support, a new drug-discovery model or diagnostic application is an unsuitable weekend commitment. The team can create value in provenance, document comparison and reducing review effort.

## Project hypotheses

| Idea | Smallest useful artifact | Evidence of usefulness |
|---|---|---|
| Scientific evidence comparison | A table linking claims to passages across supplied papers | Correct citations, contradictions found, review time |
| Trial-criteria structuring | Convert approved protocol text into reviewable inclusion/exclusion fields | Field accuracy and explicitly unresolved criteria |
| Experiment-data quality desk | Identify missing units, inconsistent identifiers and incomplete records | Known errors detected and false-positive count |

These are independent proposals, not an announced AstraZeneca brief. Prefer the first if the data is unstructured literature; choose the third if a meaningful tabular dataset is available. Trial matching should remain a research demonstration with human review, not advice to a real patient.

## Data and implementation

Ask the mentor what corpus is provided, whether redistribution is allowed, whether records can leave the supplied environment and what expert labels exist. A public abstract, a full paper and a patient record have different access conditions. Do not infer that open publication permits every downstream use.

Represent each document with its identifier, version, source, permitted use and passages. Extract structured claims with explicit “not stated” values. Retrieve evidence before generation. The frontend should open the cited passage, show contradictory evidence and allow a reviewer to correct the result. Preserve the original document and distinguish extraction from interpretation.

Use a deterministic validator for units, required fields and identifiers. A language model can propose mappings and summaries. It should not silently convert unknown measurements or infer absent clinical facts. For a comparison tool, create a small human-checked set of questions before tuning prompts, and reserve some examples for evaluation.

## What would make a strong demo?

Show a reviewer a concrete inconsistency that was difficult to find manually, the two source passages, the proposed interpretation and the human decision. Include an example where the system refuses to decide because the evidence is incomplete.

Measure citation support and extraction correctness separately. A fluent summary can be unsupported; a correct extracted field can still answer the wrong scientific question. Keep sample sizes visible and avoid claiming clinical validity from prototype results.

One developer handles ingestion and provenance, one retrieval/extraction and validation, one the review interface. Markus defines the evaluation protocol and works with the mentor to understand the decision. Do not spend the weekend training a large model unless the sponsor supplies a working baseline and the task specifically requires it.

## Preparation, combinations and decision gate

Practise a document-to-evidence table on permitted sample material. Prepare a data dictionary and uncertainty taxonomy. Exa or Context.dev could retrieve public literature if the brief allows external sources; MariaDB or Aiven could store metadata; Modal or Verda is justified only by an actual compute requirement. None grants access to AstraZeneca's private data.

Ask: who uses the result, what decision follows, what is the cost of a false positive, and what must an expert approve? **Go** with supplied data, a tractable reviewer task and credible evaluation. **No-go** if the core claim needs unavailable patient outcomes, laboratory validation or proprietary molecular labels.

**Pitch:** a bounded improvement in research workflow with auditable evidence. Scientific credibility is more persuasive than a broad promise to discover cures.

## Before committing at Junction

Ask for the actual brief, judging weights, permitted datasets and licences, required partner integration, credentials, quotas, support hours and submission requirements. Record the answers in the project README. Confirm access with one real request or end-to-end sample before making the partner a critical dependency. No event-specific credit, prize, equipment allocation or API entitlement is assumed here.

