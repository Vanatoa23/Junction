# Three-minute demo script

**Current status:** This is the intended click-through, not a runnable end-to-end demo on this branch. The foundation displays seeded suppliers and permits a real edit of our local TEST page. Paste/resolve, footprint views, polling, alerts, incidents, alternatives and approval are not implemented; their API routes return 501 and no job handlers are registered. Do not present the later steps as working or simulate their results without saying so. Timing assumes those pieces are implemented and tested.

## Before the audience

With Node 20+, pnpm 9 and Docker or PostgreSQL 14+ installed, from this checkout run:

```powershell
pnpm install
pnpm dev
```

Leave the process running. Open http://localhost:5173 and http://localhost:3001/test-notice in separate tabs. Confirm the web page reports API and DB up and the TEST page displays its editor. The default keyless demonstration uses fictional **SEED** suppliers and a **LOCAL** page; it does not demonstrate live vendor data. REC means a recorded response, if available. Keep API keys unset and do not use actual supplier information.

## Intended stage flow (3:00, after implementation)

| Time | Action | Say |
|---|---|---|
| 0:00–0:25 | At http://localhost:5173, paste five rows into the supplier grid: `Nordpack Packaging, nordpack.example, DE`; `Baltic Carton, balticcarton.example, FI`; `Rhine Foils, rhinefoils.example, NL`; `Fennia Cultures, fenniacultures.example, FI`; `Antwerp Resins, antwerpresins.example, BE`. Start resolution. **Grid and resolution are not built yet.** | “These companies and facts are fictional SEED data. The intended flow resolves the list and shows each row’s status and provenance.” |
| 0:25–0:45 | Open Nordpack’s supplier detail and point to region, port, plant and parent footprints and their states. **Detail view is not built yet.** | “A footprint describes dependencies; inferred and unknown facts stay visible, and seeded facts are not evidence from a live service.” |
| 0:45–1:10 | Open http://localhost:3001/test-notice. Replace the text in **Edit (demo only)** with the exact notice below and click **Publish notice**. Return to the app. Editing works; the planned LOCAL poll and downstream pipeline do not yet exist. | “This is our own TEST page, not a real disruption. The intended LOCAL poll would detect this change; it is not a Context.dev monitor.” |
| 1:10–1:40 | Once implemented, wait for the planned 30–60 second poll and open the TEST/poll alert. Point to its source, verified quote and `t_source`, `t_received`, `t_classified`, `t_alert` latency chips. **No alert or chips exist yet.** | “The quote should match the page text. These timestamps will show measured stages, not an invented latency; classification in keyless mode is SEED rules, not Gemini.” |
| 1:40–2:05 | Open the incident and show the quote, Rotterdam footprint and affected suppliers. **Incident view is not built yet.** | “The intended match connects the TEST incident to seeded dependencies; an inferred connection remains inferred.” |
| 2:05–2:40 | Open alternatives for Nordpack and inspect the C1 region, C2 port, C3 upstream plant, C4 sanction and C5 parent table and evidence links. **Table and checks are not implemented.** | “The planned seeded cases are Karlstad Pack VERIFIED, Maasvlakte Wrap FAILED, Tampere Board UNVERIFIED and Lodz Pack FAILED. UNKNOWN never passes; these are expected demo outcomes, not computed results today.” |
| 2:40–3:00 | Once implemented, approve the fully passing Karlstad candidate and show the audit confirmation. **Approval is not implemented.** | “A person makes the final decision; the intended approval records a snapshot. This fictional case is not a real supplier recommendation.” |

Exact TEST text:

```text
NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.
```

For today's honest demonstration, show only the supplier list, provider badges, and TEST page edit. The SSE transport is implemented, but editing the page currently does not produce an event or alert. No end-to-end latency has been measured.
