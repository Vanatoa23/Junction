# Three-minute demo script

Everything below runs today on `main`, with no API keys. What the audience sees is **SEED** (fictional companies, deterministic stand-ins) and **LOCAL** (our own TEST page, fetched by our own code). Nothing here is live Context.dev, Exa, Cala or Gemini data, and you should say so on stage. The top bar shows the provider badges (`contextdev SEED`, `exa SEED`, `cala SEED`, `gemini SEED`, `local LOCAL`).

## Before the audience (2 minutes)

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 (the web app) and keep http://localhost:3001/test-notice handy (the TEST page, also reachable from the web app's "TEST page" tab). If 5173 is taken Vite picks the next port, so read the terminal.

Reset to a clean state before each rehearsal so the numbers below match: `pnpm db:reset` (local database only), then restart `pnpm dev`. Repeated pastes of the same names create duplicate rows in the grid (alerts are de-duplicated per company, the grid is not).

The default poll interval in dev is 10 s (`INGEST_POLL_INTERVAL_MS`, 45 s with `NODE_ENV=production`). The UI says "30 to 60 s" on the TEST tab as the production figure.

## Stage flow

| Time | Action | Say |
|---|---|---|
| 0:00 | Open **Suppliers**. Point at the 10 pre-loaded rows (badges SEED and SEEDED). | "A demo client with ten fictional suppliers. Everything labelled SEEDED is made up and shown as such." |
| 0:15 | Paste the **demo list** (block below) into the box and click **Resolve**. Rows go pending, resolved, monitored in about two seconds. ("Load sample names" loads a different short list that also shows one ambiguous and one unresolved row, but not the Rotterdam-exposed supplier.) | "Pasted names are resolved against seed data, not a live vendor. Every row shows its status and where its footprint came from." |
| 0:35 | Expand a pasted row: region, port, plant and parent chips with ✓ confirmed, ~ inferred, ? unknown, S seeded. For **Helsinki Steel Cans** (shown as "needs your choice") click **This one** on one of the two options. For **Northwind Industrial Fasteners** type `kalevatrade.example` and click **Resolve with domain**. | "Ambiguous names ask a person; unresolvable ones ask for a domain. Unknown facts stay visible as unknown." |
| 1:00 | Open the **TEST page** tab. Click **Load demo trigger text**, then **Publish to TEST page**. | "This is our own page, labelled TEST. It is not a real disruption and it is not a Context.dev monitor: a LOCAL poll scrapes it and diffs it." |
| 1:15 | Switch to **Live feed**. Within one poll interval the alerts appear. Open the first: source link, the verbatim quote, `t_source`, `t_received`, `t_classified`, `t_alert` chips, the **poll**, **SEED** and **TEST** badges. | "The quote was checked against the fetched text in code. `t_source` is the page's own 'last updated' stamp, never invented. Classification here is a deterministic rule-based stand-in for Gemini, so the badge says SEED." |
| 1:50 | Click **Open incident**: STRIKE, HIGH, footprint `PORT:NLRTM` (confirmed) and `REGION:NL-ZH` (inferred), and the affected suppliers. | "The footprint is matched against every supplier: Nordpack and Rhine Foils directly, Antwerp Resins through an inferred port, and Rhine Valley Closures if you pasted it." |
| 2:10 | Click **Find alternatives** on the Nordpack alert. Show four candidates: Karlstad Pack VERIFIED; Tampere Board UNVERIFIED (C5 unknown parent); Lodz Pack FAILED (C5 same owner as Nordpack); Maasvlakte Wrap FAILED (C1 and C2, same region and port). | "Five checks per candidate, each with a reason. Unknown never passes, and an unverified candidate never ranks above a verified one. The live news check shows 'not run': there is no Context.dev key." |
| 2:40 | Click **Approve this supplier** on Karlstad Pack. The other buttons are disabled. | "Only a fully passing candidate can be approved, and the server re-checks that. The decision is stored with a snapshot of all check results." |
| 2:55 | Close: "This is the working core. Next step is switching the four providers to live, which is one key each." | |

Demo list (name, domain, country; fictional, resolved from seed data; this is `DEMO_PASTE_LIST` in `apps/api/src/onboarding/demoCatalog.ts`):

```text
Savonia Dairy Cartons, , FI
Kvarken Foils
Rhine Valley Closures GmbH, , DE
Porvoo Label Works, , FI
Aarhus Cultures A/S, , DK
Gdansk Pallet Systems, , PL
Riga Crate and Pallet, , LV
Helsinki Steel Cans
Northwind Industrial Fasteners, , FI
Oulu Barrier Films, oulubarrier.example, FI
```

Exact TEST text (the button loads it for you):

```text
NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.
```

To publish from a phone, open the TEST page URL on the phone (same network, use your machine's address instead of localhost) and use its own editor.

## Measured on this machine (rehearsal numbers)

- Pasting the demo list to all rows monitored: about 1 to 2 s (SEED).
- TEST page edit to alert on screen: 1.5 to 3.3 s with a 5 s poll; with the 10 s default expect up to about 10 s. The latency chips show the real per-stage values; `t_classified` follows `t_received` by roughly 10 ms and `t_alert` by about 30 ms.
- These are local, keyless numbers. No real vendor latency has been measured.

## Check it without the UI

```bash
pnpm e2e        # needs pnpm dev running; paste, edit page, SSE, alert, quote, latency, alternatives, approve + audit row, rejected approval
```

## What not to claim

- Not live: every vendor call is SEED or LOCAL. The live provider code exists but has never run against the real services (UNVERIFIED).
- Not measured: Context.dev monitor or webhook latency, Gemini accuracy, Exa or Cala coverage.
- Not built: live news re-check results, second-client privacy (row-level security), accuracy dashboard, downstream monitoring, Valio order.
- The 10 pre-loaded rows stay RESOLVED, not MONITORED: nothing arms a watch for them. Only pasted rows reach MONITORED (the poll watches the TEST page for all of them).
