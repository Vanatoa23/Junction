# Three-minute demo script

**The pitch (say this first):** "SecondSource watches your suppliers, and their suppliers, so you hear about a problem before it reaches your deliveries. Green means no sign of trouble, **yellow is an early warning, red needs attention now**." Full picture in `VISION.md`.

For a Head of Supply and a Head of Sales. Everything runs with no API keys, on fictional companies (`.example` websites) and our own demo notice page. Say so once at the start: "These companies are made up, and the disruption notice comes from a demo page we control." The screens never show technical labels; if someone asks what is real, the honest answer is in the last section.

## Before the audience
```bash
pnpm install
pnpm dev
```
Open http://localhost:5173. For a clean state run `pnpm db:reset` first (it works while the stack runs), then refresh. The demo company is "Demo Dairy Oy" in Helsinki with 10 suppliers.

## Stage flow
| Time | Action | Say |
|---|---|---|
| 0:00 | **Map** screen. Point at the hub, supplier dots, small port and logistics pins, and dotted example journeys. Zoom out with the minus button: suppliers merge into country bubbles. Zoom in on Germany: names and cities appear. | "Solid lines show who we buy from and their risk. Dotted lines are illustrative product journeys through real locations, not tracked shipments." |
| 0:30 | Click **Rhine Foils** (green, "Low risk", score 22). Read the reason: "Most of its own suppliers (2 of 2) ship through Port of Rotterdam." | "We do not draw the suppliers' suppliers, but we look at them in the background. Rhine Foils is fine today, but everything behind it goes through one port. Remember that." |
| 0:55 | Click **+ Add supplier**, type `Savonia Dairy Cartons`, tap **+ City** and **+ What they supply** (optional), **Add supplier**. A new dot appears. | "Only the name is needed. We look up the rest and tell you what we found and what we could not." |
| 1:25 | Click **Test a disruption** (small grey link under the map), **Publish notice**. Within about 10 seconds the headline appears: "Strike at Port of Rotterdam. 3 of your suppliers are affected." Red area over Rotterdam, three red lines and dots (the lines and dots take the supplier's colour), the two early-warning suppliers turn yellow. | "A strike is announced at the Port of Rotterdam. It is a demo page, clearly marked TEST. We noticed within seconds." |
| 1:55 | Point at the two yellow dots and lines (Baltic Carton, Hansa Labels): not hit directly, but one of their own suppliers ships through Rotterdam. Then **See what to do** opens Alerts: the five steps. Click **Find a replacement** on Nordpack Packaging. | "Two more suppliers turned yellow, an early warning, without being named in the notice: that is the deeper tier at work. Red means attention now; yellow means watch it. Here is what happened, how fast we noticed, who is affected." |
| 2:15 | Replacement cards: Karlstad Pack **Safe to approve**; Tampere Board **Needs a check** (owner unknown); Lodz Pack and Maasvlakte Wrap **Ruled out** with a reason. Open **How we know** on one. | "Unknown never counts as safe. We only let you approve a candidate that passes every check." |
| 2:40 | Click **Approve this replacement** on Karlstad. "Approved by you at 10:42. Recorded." | "A person decides, and the decision is recorded." |
| 2:55 | Back on **Map**: Nordpack is still red until the supplier is switched; the timeline shows "You approved". | "That is the loop: notice, impact, safe alternative, approval." |

To publish from a phone, open the demo page (`http://<your-computer>:3001/test-notice`) and use its editor.

## Checking it without the UI
```bash
pnpm e2e    # needs pnpm dev running: add suppliers, publish notice, alert, replacements, approve, rejected approval
```

## What is real and what is not (say this if asked)
- Aim: pre-scraped company data and a growing connection graph, fed by Exa, Cala and Context.dev (see `VISION.md`). The demo uses fictional stand-in data for that.
- Real: the pipeline (watching the notice page, reading it, checking the quote against the page text, matching suppliers, scoring risk, running the checks, approval record, the map). The reference ports and logistics areas are real places with approximate map pins.
- Not live: company facts, supplier locations, supplier-of-supplier data, product journeys and the replacement pool are fictional demo data; the notice classifier is a simple rule-based reader, not an AI model. Connecting real company data and a real language model is a matter of adding keys (see README); that code exists but has not been run against the real services.
- Not built: live news re-check, a second customer account, an accuracy dashboard.
