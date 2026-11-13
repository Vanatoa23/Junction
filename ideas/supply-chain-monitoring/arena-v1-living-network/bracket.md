# Living Supply-Chain Network: 64-entrant arena record

**Status:** design recommendation for the team. Nothing here has been built or tested. Judge: Claude (Opus 5.5). Entrants: 64 Haiku 5.5 subagents, each given the same brief (`brief.md`), the same rules (`rules.md`) and a different angle. The full proposals are in `entrants/NN.md`.

## Method
- The single-elimination bracket paired entrants by number (1v2, 3v4, …) with no seeding.
- Round-of-64 and round-of-32 matches were judged on a condensed version of each proposal (bold bet, architecture, demo, build plan, admitted weakness). The round of 16 onward was judged on the full proposals.
- **Weights:** Valio fit 30%, 48h feasibility and demo reliability 25%, Context.dev fit 15%, trust and privacy model 10%, concreteness 10%, side-bounty stacking 10%.
- **Limits:**
  - The field is one model and one brief.
  - Only 20 subagents could run at once, so entrants 24–64 were written by reusing finished subagents, with orders to start fresh. Some carry-over is visible: 24 echoes 01, 45 echoes 17 and 54 echoes 27. I judged them on their merits.
  - No entrant checked the real Valio mock API or the real Context.dev API.

## Results
| Round | Winners |
|---|---|
| R64 → R32 | 01, 04, 05, 08, 09, 12, 14, 15, 17, 19, 21, 24, 26, 27, 30, 31, 33, 35, 38, 39, 41, 44, 45, 48, 50, 51, 53, 55, 57, 60, 62, 64 |
| R32 → R16 | 01, 08, 12, 14, 17, 21, 27, 31, 33, 39, 41, 45, 51, 55, 60, 62 (pairs below*) |
| R16 → QF | 01 (over 08), 14 (over 12), 17 (over 21), 27 (over 31), 39 (over 33), 45 (over 41), 51 (over 55), 60 (over 62) |
| QF → SF | 14 (over 01), 17 (over 27), 39 (over 45), 60 (over 51) |
| SF → Final | 17 (over 14), 60 (over 39) |
| **Champion** | **60 "Hold Week" (scenario designer)**, runner-up 17 "Upstream" (hidden concentration) |

*The R32 pairs were 01v04, 05v08, 09v12, 14v15, 17v19, 21v24, 26v27, 30v31, 33v35, 38v39, 41v44, 45v48, 50v51, 53v55, 57v60 and 62v64. Winners: 01, 08, 12, 14, 17, 21, 27, 31, 33, 39, 41, 45, 51, 55, 60, 62.

## Key match reasoning
- **Final, 60 over 17.** Both centre on hidden upstream concentration. 60 turns it into one causal story where every judging criterion gets a beat with seeded numbers:
  - a hold at a shared co-op
  - a price premium
  - one alternative hidden because it did not opt in
  - one alternative rejected for an expired certificate
  - a partial fill and a substitution that needs re-approval
  17 contributes the best product rule in the field: alternatives must not share the failing upstream hub.
- **SF, 17 over 14.** 14 has the best exception engineering (exception catalogue, inject panel, safe order retry after a timeout), but it drops the graph story. Without the network insight, the product is a generic ordering bot. 14's exception work is merged into the plan instead.
- **SF, 60 over 39.** 39's ranked inbox is the right home screen, but it is a UX shape, not a whole design. It becomes the home screen of the merged plan.
- **QF, 14 over 01.** 01's mandate card is strong, but 14 is more concrete on Valio's exception and robustness criteria, and it lets judges trigger exceptions themselves.
- **QF, 17 over 27.** 27's two-source corroboration is the best real-timeness mechanic in the field. 17 wins because it links risk directly to the procurement decision.
- **R16, 39 over 33.** 33 has the best Context.dev beat: the presenter edits a page we host, and the monitor fires an alert in about 10 seconds. But it puts ArcadeDB on the critical path and thins out the Valio flow. Its live beat is merged into the plan.
- **R16, 45 over 41.** 41's what-if simulator, with a trust-floor slider, is the most novel feature in the field, but it needs an in-memory graph engine, an animation layer and a sandbox overlay. That is too much for 48 hours next to the core flow. 45's LIVE/REC/SEED source adapter is merged into the plan.

## The field's consensus (62 of 64 agree on most of these)
- **Postgres on Aiven, not ArcadeDB.** Only 6 entrants put ArcadeDB on the critical path, and none of them reached the quarterfinals. At demo scale (hundreds to a few thousand nodes, at most 4 hops), recursive CTEs are enough.
- **Gemini function calling.** The LLM classifies and extracts. It never sets a score, never changes trust and never places an order.
- **Cytoscape.js for the graph.**
- **Hash-chained audit log with a "verify chain" button.**
- **A cached fallback for every live call, labelled honestly.**

## Ideas stolen from losers (adopted in `final-plan.md`)
01 mandate card · 02/33 monitor on a page we host, with latency shown · 04/22 Postgres row-level security and "why can't I see this" · 08 MCP server for external agents (stretch) · 12 approval bound to the quote hash · 14 exception catalogue, inject panel, `callExternal()` · 17 upstream-disjoint alternatives · 19/46 "type any company" lookup for judges · 27 two-source corroboration · 31 trust state machine · 35 explainable score factors with per-hop decay · 39 inbox home · 41 trust-floor toggle on blast radius · 44 origin chips · 45 LIVE/REC/SEED adapter · 51 delivery-performance dip as a signal · 52 contracts frozen in hour 1 · 53 CRACI SBOM in CI · 57 Finnish sources (Ruokavirasto)
