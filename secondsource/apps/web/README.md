# apps/web

React 18 + Vite + MapLibre GL. Designed for a non-technical Head of Supply or Head of Sales (design chosen in `ARENA.md`: "The map is the beauty").

## Screens
| Screen | What it shows |
|---|---|
| **Map** (home) | Rotatable 3D globe with an atlas-style basemap. Your company is the hub; one line to each **direct** supplier. Dots **and lines** are coloured by risk: green = no sign of trouble, yellow = early warning, red = needs attention now (a small legend sits on the map). Zoomed out, suppliers in one country merge into a numbered bubble; zoomed in, names (and cities when closer) appear. A disruption is a soft red area at its place, affected suppliers pulse once, and one plain headline sits above the map. Click a dot for the supplier card. |
| **Suppliers** | Plain list, riskiest first: where, what they supply, status, risk. |
| **Alerts** | What happened, newest first. Opening one shows five steps (We noticed, We checked, Suppliers affected, Replacements found, You approved), the affected suppliers, and the sentence from the notice. |
| **Add supplier** (button) | Name is the only required field; website, country, city, what they supply, how important, yearly spend, lead time, contact and notes are optional chips. Or paste a list. Afterwards: "Found: ..." and "Could not find: ...". |
| **Supplier card** | Risk score with up to three plain reasons, what we found and could not find, what you told us (editable), a replacement button when there is an alert, and a chooser when the name was ambiguous. |
| **Replacements** | Ranked cards: Safe to approve, Needs a check, Ruled out, each with one sentence and "How we know". Approve is one click and is recorded with the time. |
| **Test a disruption** | A small grey link at the bottom of the map (clearly marked TEST) that publishes a notice on our own demo page. |

## Rules the UI follows
- Plain words only: no provider names, no SEED/LIVE/REC/LOCAL, no check codes, no job or footprint talk. (The adapters and modes still exist in the backend and in `/health`.)
- Deeper tiers (a supplier's own suppliers, ports, plants) are never drawn. The backend uses them to compute each supplier's risk score and its reasons.
- Unknown is never shown as safe: an unchecked candidate says "Needs a check" and why.
- The demo notice is labelled TEST/"Demo notice" wherever it appears.

## Map notes
The globe uses bundled Natural Earth country outlines and works offline. Drag to rotate, scroll to zoom, or select **Show all** to fit your supplier network. **Globe view** returns to the whole Earth. Supplier positions come from the API (`GET /map`) and use the known city or an approximate country centre.

## Supplier evidence

Paste spreadsheet rows or a comma-separated list with a name, an optional website, and an optional country code. Existing matches are reused. Open an ambiguous result to pick the company or provide its website.

Open a supplier card and choose **Add dependency** or review a suggested plant or port. Nest a dependency under an upstream supplier to record a longer chain. Each link has a source, confidence, and last verified date. If an open disruption matches a recorded plant or port, the card shows the matching path and its evidence. Dashed rings on the map indicate limited coverage. Coverage requires a plant, a port, and an upstream path to a plant or port with evidence rated at least medium confidence and verified within the past 365 days.

Buyer-entered dependencies are scoped to the demo workspace in the database and are excluded from the shared company catalog. The local MVP still uses a single demo client without sign-in.

## Dev
`pnpm --filter @secondsource/web dev` (port 5173, proxies `/api` to the API; `API_PORT` changes the target). `pnpm --filter @secondsource/web typecheck`.
