# Arena rules for entrants

You are one of 64 independent entrants in a single-elimination tournament. Every entrant gets the same brief (`brief.md`, next to this file) and a different **lens**. A judge compares proposals head to head. Your lens is your angle and your edge: lean into it hard, but the proposal must still be a complete, buildable answer to the whole brief. A lens that ignores the brief loses.

## Hard constraints (breaking one is an automatic loss in a close match)
1. Buildable and demoable live by ~4 engineers in 48 hours (Fri evening to Sun morning code freeze). No component that needs days of setup.
2. The privacy rules in the brief are decided: a company's own map is private; buyers see only risk warnings, anonymised aggregates, opt-in alternatives and published prices.
3. The four trust levels (`inferred`, `claimed`, `agreed`, `audited`) exist on every edge, and inferred data shows confidence plus source URLs.
4. A human approves before any order is placed. Orders go through the Valio (mock) API.
5. At least one agent run pulls real web data live during the demo, with visible source URLs.
6. Do not invent sponsor API features beyond what the brief says. If you assume something about an API, label it as an assumption.

## Judging criteria (weights)
- Valio "Trusted Trade Agents" fit (end-to-end demo, buyer need, guardrails/auditability, exception handling, open standards): 30%
- Feasibility in 48h with 4 engineers, honest prioritisation and demo reliability: 25%
- Context.dev fit (live web data in the core flow, real-timeness, sourcing): 15%
- Correct trust and privacy model: 10%
- Concreteness (actual schemas, queries, prompts, screen contents, timings): 10%
- Smart stacking of side bounties (Gemini, Aiven, Codex, CRACI, Cala) without hurting the core: 10%

## Output format (strict)
Write your proposal as Markdown to the output file named in your task. **Hard cap: 1300 words.** Dense bullets, no filler, no restating the brief. Use exactly these headings:

```
# Entrant NN: <short title> (lens: <lens>)
## 0. Bold bet (2 sentences: what makes this proposal different and why it wins)
## 1. Summary and name
## 2. Architecture and DB choice
## 3. Data model and key queries
## 4. Agents (discovery, monitoring, procurement)
## 5. Risk engine
## 6. Screens and graph view
## 7. Demo script (timed beats)
## 8. 48h build plan (4 engineers, 4 milestones)
## 9. Judging-criteria mapping
## 10. Risks and cuts
## 11. Biggest weakness of this proposal (be honest)
```

Do not do any web research except at most 2 quick searches to check a specific technical fact you rely on. Do not create any other files. When the file is written, reply with one line: `done NN`.
