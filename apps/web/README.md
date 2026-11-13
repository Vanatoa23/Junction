# apps/web

**Owner: UI thread.** Foundation provides a minimal shell (health, supplier list, SSE feed). UI replaces it: paste grid, live feed over SSE, incident view, alternatives check table, approve.

All data types come from `@secondsource/shared`. API base is `/api` (Vite proxy to the API, prefix stripped). Show the `mode` badge (LIVE / REC / SEED), the TEST label, and source URLs everywhere a fact appears. Say "poll" when `via=POLL`.
