-- Ingest (additive; proposed by the Ingest thread, integrator to confirm numbering).
-- 1) Last stored snapshot per watched URL, for scrape-and-diff polling.
CREATE TABLE IF NOT EXISTS watch_snapshot (
  url text PRIMARY KEY,
  content_hash text NOT NULL,
  text text NOT NULL,
  last_polled_at timestamptz NOT NULL DEFAULT now(),
  last_changed_at timestamptz NOT NULL DEFAULT now()
);
-- 2) Webhook dedupe on X-Context-Id (stored in event.raw->>'contextId').
CREATE UNIQUE INDEX IF NOT EXISTS event_context_id_uq ON event ((raw->>'contextId')) WHERE raw->>'contextId' IS NOT NULL;
