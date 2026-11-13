# apps/api/src/ingest

**Owner: Ingest thread.** Monitors, webhook receiver, scrape-and-diff poll (default live path, UI says "poll"), TEST notice page, latency timestamps.

Foundation gives you: `testNotice.ts` (page + edit endpoints, working), `index.ts` (ModuleDef with 501 stubs), job kinds `arm_monitors` / `poll_page`, the `source()` adapter (`contextdev.scrape`, `contextdev.monitor_create`), the `event` table, SSE `publish()`.

Rules: webhook and poll both call ONE shared `ingestChange()`; verify the signature on RAW bytes (add a content-type parser for raw body inside this folder); set `t_received` honestly, `t_source` only if the source gives one; never touch other modules' folders; contract changes go through the integrator.
