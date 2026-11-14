# Design arena

Markus asked for a cleaner, plain-language demo for a non-technical Head of Supply and Head of Sales, with a zoomable supply-chain map. Instead of picking one design ourselves, we ran a knockout arena.

**Format:** 32 designers (Haiku 5.5 subagents), each given the same brief (`docs/arena/BRIEF.md`) and a different angle. Single elimination in 5 rounds (16, 8, 4, 2, 1 matches), every match judged by a Haiku 5.5 judge against fixed criteria, in priority order: understood in seconds by a non-technical reader, calm and beautiful, a map that explains itself at world and local zoom with lines to direct suppliers only, simple add-supplier flow, honest alerts and alternatives, feasible in a day of React. All proposals are in `docs/arena/entries/`, every verdict in `docs/arena/rounds/`.

**Limits to be honest about:** one model family wrote and judged every entry, entries were not built or tested with real users, and judges saw only text. Treat the result as a strong first design, not evidence of usability.

## Path to the final
| Round | Survivors |
|---|---|
| 1 (32 to 16) | e01 map-first, e03 dark control room, e05 wizard, e08 risk hero, e09 story timeline, e12 head-of-supply lens, e13 minimal, e15 fintech polish, e18 traffic lights, e19 master-detail, e21 zero-config, e24 illustrated, e25 muted map, e28 wow-in-10s, e29 two-level zoom, e32 wildcard |
| 2 (16 to 8) | e01, e08, e09, e15, e18, e21, e25, e32 |
| 3 (quarterfinals) | e08, e09, e21, e25 |
| 4 (semifinals) | e09, e25 |
| 5 (final) | **e25, "The map is the beauty"** beat e09 "Story timeline" |

## Why e25 won (from the final verdict)
It puts the company on a calm map as the hub, draws lines only to direct suppliers, and specifies what happens at country zoom (numbered bubbles) and city zoom (names and cities). A disruption shows where the problem is (a soft red area) and why (a plain sentence about the hub), colour is reserved for risk, and a side panel means the map never disappears.

## Ideas merged in from the runner-up (e09)
1. A five-step timeline on each alert: We noticed, We checked, Suppliers affected, Replacements found, You approved.
2. One plain headline above the map: "Port closure at Rotterdam. 3 of your suppliers are affected."
3. Add-supplier result lines: "Found: ..." and "Could not find: ...".
4. Offline fallback: a plain world outline under the map tiles, with the same dots and lines.
5. A "How we know" section that explains each check in everyday words.
6. A timestamped approval confirmation.

## What was built
See `STATUS.md` for the current state and `apps/web/README.md` for the screens.
