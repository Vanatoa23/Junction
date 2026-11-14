# Design arena brief: SecondSource demo

You are one of 32 designers. Propose ONE design for the demo web app. A judge will compare it head to head with another proposal. Write a concrete, buildable proposal, not a mood board. No code, only a design spec in Markdown (max 450 words).

## The product
SecondSource is a live supply-chain risk monitor. A company adds the businesses it buys from. We watch the public web for disruptions (strikes, port closures, fires, sanctions, recalls, insolvency). When something hits a supplier, the company sees an alert in plain language, sees where the problem is, and is offered replacement suppliers that the same incident cannot touch (different region, port, upstream plants, owner, no sanctions). A person approves the replacement.

## The users (design for them, they are NOT technical)
- **Head of Supply** (buys materials, worries about continuity, wants alternatives fast).
- **Head of Sales** (worries about late deliveries to customers, wants a clear "are we affected, how badly, since when").
Neither knows what an API, a footprint key, a confidence mode or a job queue is. Never show technical words (SEED, LIVE, REC, LOCAL, provider names such as Exa, Cala, Gemini, Context.dev, C1..C5, footprint, job, SSE).

## What the demo must do
1. **Add suppliers easily.** Only the name is required. Optional, never forced: website, country, city or address, what they supply, how critical they are, rough yearly spend, lead time, contact, notes. Add one at a time or paste a list. The system finds more facts by itself, and shows what it found and what it could not.
2. **Show the supply chain on a zoomable map.** Our company is the hub. Lines go from the company to each DIRECT supplier only (no deeper tiers drawn). It must be usable zoomed out (international, continents) and zoomed in (local, one region or city). Deeper tiers (the suppliers' own suppliers, ports, plants, owners) are researched in the background and only feed a **risk score with a plain-language reason** on each supplier ("2 of its own suppliers ship through Rotterdam"). Do not draw them.
3. **Monitor and alert.** A short, calm list of what is happening: what, where, which suppliers, how serious, how fast we noticed. When there is a disruption, the map shows it (affected suppliers and lines change colour, the hub explains why).
4. **Offer alternatives.** For an affected supplier: a few ranked replacements, each clearly "safe to approve", "needs a check" or "ruled out", with a one-sentence reason. Approve is one click; it records the decision.
5. **Run a live demo on stage.** A discreet control lets the presenter publish a fake disruption notice and watch the alert appear within seconds.

## Tech and data you may rely on
React 18 + Vite + TypeScript, existing app. Map: Leaflet with online map tiles and an offline fallback outline of the world. Each supplier has: name, status (new, checking, ready, needs your choice, could not find), country, city, coordinates, category, risk score 0 to 100 with level (low, medium, high) and reasons, alerts, alternatives. Seed demo: 10 suppliers around Europe, an incident at the Port of Rotterdam. No login. Desktop first (stage screen), tablet fine.

## What to include in your proposal (use these headings)
1. **Concept** (2 sentences, the idea and the feeling).
2. **Navigation and screens** (what the user sees first, how many screens, names in plain words).
3. **Add-supplier flow** (fields, order, how optional data is offered without overwhelming).
4. **Map** (hub and lines, colours, markers, zoom behaviour, what a click shows, how a disruption looks).
5. **Risk and explanation** (how a score and its reasons are shown to a non-expert).
6. **Alerts and alternatives** (layout, wording, the approve moment).
7. **Visual style** (palette with hex values, typography, spacing, mood, light or dark).
8. **What you deliberately leave out.**

Be opinionated and specific. Fewer, clearer things beat more things. Judges reward: usable by a non-technical person in seconds, beautiful and calm, a map that explains itself at every zoom level, honest wording, and feasibility in one day of React work.
