# apps/api/src/onboarding

**Owner: Onboarding thread.** Paste flow, resolver (Context.dev company search, Exa + Cala fallback, score 0.5 name / 0.2 country / 0.3 domain agreement, chooser for 0.6-0.85, flagged < 0.6), footprint extraction, status PENDING -> RESOLVED -> MONITORED.

Foundation gives you: `GET /suppliers` (+ `/:edgeId`) via `db/mappers.ts#loadSuppliers`, job kinds `resolve_supplier` / `extract_footprint`, `source()` ops for contextdev/exa/cala/gemini (seed providers cover the seeded companies), SSE `supplier.status`.

Rules: every real key needs a sourceUrl; SEEDED/user-typed facts are labelled `seeded`; never send client names or the supplier list to external search; contract changes go through the integrator.
