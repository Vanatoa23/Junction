# packages/checks

**Owner: Engine thread.** Pure, unit-tested C1..C5 functions. Foundation provides the typed skeleton (`src/index.ts`) and the nested-region helper (`src/regions.ts`). Bodies of c1..c5 are stubs returning UNKNOWN.

Rules: pure (no I/O/clock/LLM), UNKNOWN never passes, every result has a `reason`, FAIL carries evidence. Signatures change only through the integrator.
