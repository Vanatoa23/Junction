# MVP summary

**Scope and confidence.** At foundation commit `6efaa22`, this is a keyless scaffold, not the complete demo. `STATUS.md` reports local verification; the design report (`report.html`) was not available in the repository or attached artifacts, so the estimate below uses `PLAN.md` as a proxy and cannot cover report-only requirements.

**Working locally.** `pnpm dev` starts the database, API, worker and web shell; health, the 10-supplier list, editable TEST notice, job queue and cross-process SSE transport work according to STATUS. The page edit is real and LOCAL, but no poll or event pipeline connects it to an alert. Supplier data, footprints and candidate pool are fictional SEED; the keyless classifier is deterministic SEED rules, not Gemini. REC is a recorded-response mode, not a live call; no real vendor fixtures are documented as captured. LOCAL scraping is restricted to our own host. LIVE vendor implementations exist but have never been verified against the services.

**Not yet working.** Paste/resolve and chooser, monitoring, webhook ingestion, event/alert/incident routes, incident matching, alternatives and approval return 501 or lack handlers; the web is a minimal shell. C1–C5 currently return UNKNOWN, except for a real nested-region helper. The expected candidate verdicts in the plan are targets, not results produced by this branch. Quote verification code exists, but the full classification-to-alert path is not wired.

**API findings — documented or assumed, all unverified live** (see `docs/api-findings.md`; exact fields and current availability need first-call confirmation):

- **Context.dev:** company search and fresh scrape are documented; a monitor has a documented 10-minute minimum and a baseline run, making a 3-minute autonomous webhook demo unsuitable. Webhooks require a public URL and signature verification; fresh scrapes specify `maxAgeMs: 0`. The “Run now” endpoint remains unknown.
- **Exa:** `/search` with company category is the proposed candidate discovery path; Websets is asynchronous and requires a paid plan. Limits and real result shapes need verification.
- **Cala:** fuzzy entity search and relationship queries are documented; discover available ownership edges via introspection. Coverage for small Nordic suppliers is unknown.
- **Gemini:** structured output is documented but request shapes conflict in the findings. Confirm model and schema on a real call; validate the returned quote against source text in code.

**Biggest risks.** Unverified integrations, quotas and coverage can prevent a real-data demo; sparse or inferred footprints can leave alternatives UNKNOWN; poll/webhook reliability and a public tunnel affect timing; and fictional or recorded evidence can be mistaken for live evidence unless provenance is visible throughout. Fail closed on unknowns and measure actual latency.

**Rough extra effort:** approximately **3–6 engineer-weeks** to implement and integrate the PLAN's keyless end-to-end flow (onboarding and footprint UI, poll/diff and event processing, classification/matching, checks and approval, tests and rehearsal), plus **1–3 engineer-weeks** for keyed vendor validation, fixture capture and fixes, tunnel/webhook testing and real-data coverage checks. These are overlapping, highly uncertain person-week estimates, not a delivery commitment; access to keys, vendor behaviour and requirements in the missing report could materially change them.
