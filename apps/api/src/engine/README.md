# apps/api/src/engine (+ packages/checks)

**Owner: Engine thread.** Gemini classifier + code-side verbatim quote check, incident footprint, matching to client suppliers (nested regions), alerts, candidate pool + ranking, C1..C5 in `packages/checks` (pure, unit-tested, UNKNOWN never passes), approve + `approval_audit`. Stretch: live news re-check.

Foundation gives you: job kinds `classify_event` / `match_incident` / `find_alternatives`, tables `incident`, `alert`, `candidate`, `check_result`, `approval_audit`, `loadSuppliers`/`companyFootprint` mappers, `source()` ops (`gemini.classify`, `exa.search`, `cala.ownership`), seeded candidate pool (VERIFIED / FAILED / UNVERIFIED cases are built in, see `seed/data.ts`).

Rules: incident rows exist only if the quote passed (DB enforces quote_verified); dropped events get `status=DROPPED` + `drop_reason`; incident from the TEST page has `is_test=true`; contract changes go through the integrator.
