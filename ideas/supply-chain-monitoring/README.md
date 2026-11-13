# Supply-chain monitoring: arena results

This folder is the design research for our supply-chain idea, done as two "arena" tournaments. Many independent AI-written proposals competed in a knockout bracket, and a judge model merged the winner with the best ideas from the proposals that lost. It is a design recommendation, not code. No sponsor API (Context.dev, Exa, Cala, Valio) has been tested yet.

**Start here: [report.html](report.html).** It's the readable final report; download it or open it locally, because GitHub shows HTML files as source code.

## Current recommendation: SecondSource (arena v2)
**Target:** the Context.dev challenge.

**What it is:** live monitoring of a client's supply chain, with alternative suppliers that the same incident cannot affect.

- **Onboarding:**
  - The client pastes its supplier list.
  - Cala supplies company identity and ownership.
  - Exa finds domains and alternative candidates.
  - Context.dev enriches each company and extracts its plants and ports.
  - Target: 10 names fully monitored in under 60 seconds.
- **Monitoring:**
  - Context.dev monitors with webhooks watch each supplier's pages and news.
  - Shared monitors watch the ports and regions the suppliers depend on.
  - Gemini classifies each change and must quote its source.
  - An incident is confirmed by an official source, or by two independent sources.
- **Incident footprint:** the regions, ports, plants, sanctions programmes and parent companies an incident touches. Each one has a source URL and a state: Confirmed, Inferred or Unknown.
- **Alternatives agent:**
  - Every candidate goes through five checks (region, port, upstream plant, sanctions, parent company), plus a live Context.dev news check.
  - The rule fails closed: anything unknown is shown as "unverified", never as safe.
  - A human approves the switch.
- **Upstream:** in, but narrow (two hops via Cala).
- **Downstream:** a customer-watch lane, as a stretch goal.
- **Stack:** TypeScript, Aiven Postgres (also the job queue), Aiven Runtime. No graph database, no Kafka.

## Contents
| Path | What it is |
|---|---|
| `report.html` | Final human-readable report for arena v2: recommendation, architecture, demo script, 40-hour plan, risks, bracket |
| `arena-v2-context-dev/` | Arena v2, 16 entrants: the brief, the rules and all proposals |
| `arena-v1-living-network/` | Arena v1, 64 entrants, on the earlier "living supply-chain network" brief that targeted Valio first: brief, rules, `bracket.md`, `final-plan.md` and all proposals |

## Method and limits
- **Who wrote and judged:** Claude Haiku 5.5 wrote the proposals, each with the same brief and a different angle. Claude Opus 5.5 judged them in single elimination, against the weights given in each `rules.md`.
- **One model:** every proposal comes from the same model, so they share its blind spots.
- **Reused subagents in v1:** only 20 subagents could run at once, so entrants 24–64 reused earlier subagents. A few show traces of their earlier proposal.
- **Untested APIs:** every API behaviour in these documents is an assumption to check in the first hour of the hackathon.
