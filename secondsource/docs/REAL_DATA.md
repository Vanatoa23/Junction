# Real-data scenario (public Cala packs)

`pnpm dev:real` runs SecondSource on **recorded real data** instead of the fictional demo company. Keyless and offline. The fictional demo is untouched: `pnpm dev` still runs it.

## Where the data comes from
| Pack | What we take | Where it lives |
|---|---|---|
| `world_v0` (Crucible PR 17, public snapshot) | 218 supplier-to-buyer links, 607 facility records (24 countries), 16 freight routes, 8 cited public documents | vendored in `data/packs/cala/world_v0/` |
| `starting_grid_v0` (Junction repo) | 43 ports with coordinates, 578 headquarters records (alias, city, country) | `../data/packs/cala/starting_grid_v0/` (repo root) |

Override the locations with `CALA_WORLD_DIR` and `CALA_GRID_DIR`. If the world pack is missing, `seed:cala` says so and does nothing.

**Names stay anonymous.** Both packs use aliases (`Supplier-0131`, `Site-0008`, `Company-2c5c...`). We never try to undo that, we store no domains for them, and for headquarters records we do **not** copy the pack's per-company source URLs (they point at real company pages). Real names exist only in the Crucible repo's private archive, which this project never reads. A test (`cala.test.ts`) fails if a recorded company name or domain stops being an alias.

## What becomes of it
- **A second demo client**, "Real-data demo (anonymised buyer)". Hub placed in Helsinki: that is an **assumption** (the pack does not say where the buyer is).
- **Direct suppliers (12)**: the best-documented suppliers of `Buyer-0001` (most countries, then most sites), including `Supplier-0131`, the one that has its own suppliers in the pack. These are the only suppliers drawn on the map.
- **Hidden tiers**: the pack's supplier-to-supplier links (48 suppliers behind `Supplier-0131`) are stored as tier-2/3 edges. They are never returned or drawn; they feed each supplier's risk (the formula is unchanged).
- **Sites (607)**: real facility records, country level. Shown on the supplier card, and as numbered dots on the map when a supplier is selected. Only the country is known, so positions are the country centre ("approximate location"); suppliers that share a country are spread on a small ring so they stay clickable.
- **Ports (43)**: real ports with coordinates, shown on the map as small anchors for ports that matter now (used by a direct supplier or named by an open incident).
- **Known companies**: the 578 headquarters records. In "Add supplier", typing a name, country or city offers matching known companies; **Add this one** adds it straight away with its real location, no lookup (`GET /known`, `POST /suppliers/snap`).
- **Alternatives**: the other suppliers in the pack (about 200), ranked, top 12 shown.

## What is real, and what is an assumption
| Fact | Status |
|---|---|
| Supplier-to-buyer and supplier-to-supplier links, facility records, their countries | **Recorded real data** (mode REC), each with its public source URL |
| Port coordinates | Real public reference data |
| **Which port a supplier uses** | **Assumption.** The pack says its carrier sources show service availability, not which supplier ships where. Each supplier is assumed to ship via one port in its main country, picked deterministically. Stored as an inferred key flagged seeded, with "Scenario assumption" in its note; the UI says "we think so, not confirmed" |
| Ownership | **Unknown** for every company (anonymised) |
| Hub location, "Test a disruption" notice | Assumption / demo notice, labelled TEST |

## Consequences to expect (these are correct, not bugs)
- Almost every supplier shows "Coverage is limited": ports are assumed and ownership is unknown.
- Replacement candidates are all **Needs a check** (ownership unknown), so nothing can be approved in this scenario. Approval is demonstrated in the fictional demo.
- Risk comes from the existing formula; with few real exposures most suppliers stay green until a disruption.
- The pack is mostly electronics with facilities in CN, JP, TW, US, KR: expect a global map, not a Nordic one.

## Run it
```bash
pnpm dev:real           # fictional seed + real pack on the same database; the stack serves the real-data client
pnpm db:seed:cala       # re-import the pack only (idempotent; keeps alerts and candidates)
```
Or by hand: set `DEMO_CLIENT_ID=00000000-0000-4000-8000-000000000002` and run `pnpm db:seed:cala` then `pnpm dev`.

"Test a disruption" publishes a notice about the port most direct suppliers are assumed to use (today: Long Beach), so the demo has real impact: two suppliers turn red.

## Later, with a Cala key
The adapters already exist (`CALA_API_KEY`). Live Cala responses would replace the recorded pack for ownership and relationships; the pack format, the aliasing rule and the "assumed port" labelling stay as they are.
