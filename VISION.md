# Vision

Written from Markus's own description (2026-11-14). Where something is our reading of it, it is marked **(our reading)**.

## The pitch for this hackathon
**Live monitoring of supply-chain risk.** A company adds the businesses it buys from. We show them on a map with a risk colour per supplier, we watch the world for things that could hit them, and we tell the company early, in plain words, what needs attention. The demo page is the thing we present: it is simple and it shows what we are aiming for.

One sentence: *"SecondSource watches your suppliers, and their suppliers, so you hear about a problem before it reaches your deliveries."*

## What the user sees
- Their own **direct suppliers only**, on a zoomable map, with lines from their company.
- One risk colour per supplier, the same on the dot and the line:
  - **Green**: no sign of trouble.
  - **Yellow**: **early warning**. Something is building up; keep an eye on it.
  - **Red**: **needs attention now**.
- A plain-language reason behind every colour ("2 of its own suppliers ship through Rotterdam").
- Optionally, **alternative suppliers** for an affected one, each checked so the same event cannot hit it.

## What the user does not see
For every direct supplier we also look at **its** supply chain (its suppliers, their ports and plants, who owns them). That evaluation feeds the supplier's risk number. The number comes from a formula (today: base level, direct exposure to open incidents, exposure through its own suppliers, concentration on one port, and a small penalty when we know little). Deeper tiers are never drawn.

## Where the data comes from
Three sources, ideally all of them, because using all of them also competes for more of the prize tracks:
- **Exa**: finds companies, products and news on the open web.
- **Cala**: company identity and ownership. *Markus wrote "claude"; **(our reading)** he meant Cala, which is how the plan has always used it. Please confirm. If he meant Claude as an analysis tool, that is a different role and would be added next to these three.*
- **Context.dev**: reads and monitors web pages (notices, news, company pages).

Gemini is **not part of the product for now**. It may be used as a coding tool while building. The code still has an optional Gemini classifier path (off without a key, never shown to users); in the demo a simple rule-based reader does that job.

## The full vision (after the hackathon)
1. **Scrape the web ahead of time** for companies all over the world: what they make and offer, who performs well, who is sanctioned, and similar facts. This becomes a **company database**.
2. **Infer a connection graph** from public data: who supplies whom, who owns whom, which ports and plants they depend on.
3. **Every user makes it better.** When a customer adds their suppliers, we upgrade the shared network in the background (new links, new facts). The customer only ever sees their own suppliers and their risk.
4. **Risk is calculated by a formula** over the graph (own exposure, exposure through deeper tiers, concentration, sanctions, ownership, performance), always with a reason that can be written in one sentence.
5. **Alternatives come from the pre-built database**: candidates in the same product area, checked against the same event (region, port, upstream plants, owner, sanctions) and shown as safe, needs-a-check or ruled out. A person approves.

Privacy follows from this shape: public facts and the shared graph are shared; a customer's supplier list, alerts and decisions are private to them (the database already carries a client id on every private table).

## How today's demo maps to the vision
| Vision | In the demo today |
|---|---|
| Live monitoring | A real poll of a notice page we host (clearly a demo), classified, matched to suppliers, scored, alerted in seconds |
| Risk colours (yellow = early warning, red = attention now) | Implemented: score under 30 green, 30 to 59 yellow, 60 and up red; same colour on dots and lines; small legend on the map |
| Deeper tiers feed the score | Implemented on fictional seeded tiers 2 and 3 (18 companies); never drawn |
| Exa + Cala + Context.dev | Adapters exist for each (one env var turns each on); **unverified**, never run against the real services; the demo runs on fictional seed data |
| Pre-scraped global database and inferred graph | **Not built.** The seeded candidate pool and seeded tiers are a tiny stand-in |
| Network grows as users add suppliers | **Not built.** Adding a supplier resolves it and gives it a footprint; it does not yet add links to a shared graph |
| Alternatives from the database | Works against the small seeded pool, with the five checks |

## Honest risks to the vision
- Public data for small private suppliers is thin; many facts will be unknown, and we show unknown as "needs a check", never as safe.
- Inferring who supplies whom from public pages is hard and will be wrong sometimes; every link needs a source and a confidence we can explain.
- Sanctions and ownership data are only as good as the source; Cala coverage of small Nordic firms is untested.
- Claims shown to customers must stay explainable in one sentence, or we should not show them.

## Open questions for Markus
1. "claude": Cala (our reading) or Claude as a tool?
2. Is "yellow starts at score 30, red at 60" the right line for early warning versus now? (A single constant today.)
3. Do we show the user how a score was built beyond the reasons (a "how we know" for risk), or keep it to the sentences?
