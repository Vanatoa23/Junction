# Arena v2 rules for entrants

You are one of 16 independent entrants in a single-elimination tournament. Every entrant gets the same brief (`brief.md`, next to this file) and a different **lens**. Lean into your lens hard, but your proposal must still answer the whole brief.

## Hard constraints (breaking one loses a close match)
1. Buildable and demoable live by ~4 engineers in ~40 hours.
2. Context.dev is in the core flow, not decoration, and at least one live change is detected and shown during the demo with source URLs.
3. Alternatives must pass an explicit, explainable "not affected by the same incident" check.
4. A client's supply map stays private to that client.
5. Do not invent sponsor API features beyond the brief. Label assumptions as **(A)**.

## Judging weights
- Context.dev criteria (impact, creative live web use, completeness, latency and accuracy, real-timeness): **40%**
- Feasibility in ~40h, honest prioritisation and demo reliability: **25%**
- Quality of the incident model and the incident-disjoint alternative check: **15%**
- Onboarding and bootstrap (client list, Exa, Cala, Context.dev enrichment): **10%**
- Concreteness (schemas, monitor configs, prompts, timings) and sensible side-bounty stacking: **10%**

## Output format (strict)
Write Markdown to the output file named in your task. **Hard cap: 1200 words.** Dense bullets, no filler. Use exactly these headings:
```
# Entrant NN: <short title> (lens: <lens>)
## 0. Bold bet (2 sentences)
## 1. Summary and name
## 2. Architecture and DB
## 3. Data model and incident footprint
## 4. Onboarding and bootstrap
## 5. Monitoring design
## 6. Incident-disjoint alternatives agent
## 7. Upstream and downstream
## 8. Screens and demo script (timed)
## 9. Build plan, risks, cuts
## 10. Biggest weakness (honest)
```
At most 2 quick web searches, and only to check a specific fact. Create no other files. When done, reply with one line: `done NN`.
