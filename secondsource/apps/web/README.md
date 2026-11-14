# apps/web

React 18 + Vite + Leaflet. Designed for a non-technical Head of Supply or Head of Sales (design chosen in `ARENA.md`: "The map is the beauty").

## Screens
| Screen | What it shows |
|---|---|
| **Map** (home) | Pale atlas. Your company is the hub; one line to each **direct** supplier. Dots **and lines** are coloured by risk: green = no sign of trouble, yellow = early warning, red = needs attention now (a small legend sits on the map). Zoomed out, suppliers in one country merge into a numbered bubble; zoomed in, names (and cities when closer) appear. A disruption is a soft red area at its place, affected suppliers pulse once, and one plain headline sits above the map. Click a dot for the supplier card. |
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
Base layer: a light vector basemap (OpenFreeMap "positron", no key) that fills the view at every zoom and pan; if it cannot load (offline) a bundled world outline is shown instead. Supplier positions come from the API (`GET /map`): exact city if known, otherwise the country centre (the card says "approximate location").

## Dev
`pnpm --filter @secondsource/web dev` (port 5173, proxies `/api` to the API; `API_PORT` changes the target). `pnpm --filter @secondsource/web typecheck`.
