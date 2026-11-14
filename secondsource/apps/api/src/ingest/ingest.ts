import { randomUUID } from "node:crypto";
import type { Event, SourceMode } from "@secondsource/shared";
import { publish } from "../bus";
import { enqueue } from "../db/jobs";
import { pool, tx } from "../db/pool";

/**
 * THE shared ingest function. Poll and webhook both end here:
 * writes the event row (raw payload, fetched_text, via, mode, t_source, t_received),
 * publishes SSE event.received, enqueues classify_event (Engine owns that handler).
 * Returns null when the change was a duplicate (same webhook X-Context-Id).
 */
export interface IngestInput {
  via: "WEBHOOK" | "POLL";
  sourceUrl: string;
  mode: SourceMode;
  /** The text the Engine's quote check will run against. */
  fetchedText: string;
  raw: Record<string, unknown>;
  isTest: boolean;
  /** When the source says the change happened; null if it does not say (never invented). */
  tSource: Date | null;
  /** When we saw it (poll finished / webhook received). */
  tReceived: Date;
  contentHash: string | null;
  monitorRef?: string | null;
  /** Webhook dedupe key (X-Context-Id). */
  contextId?: string | null;
}

export const mapEvent = (r: any): Event => ({
  id: r.id,
  via: r.via,
  sourceUrl: r.source_url,
  mode: r.mode,
  status: r.status,
  dropReason: r.drop_reason,
  isTest: r.is_test,
  latency: {
    tSource: r.t_source ? new Date(r.t_source).toISOString() : null,
    tReceived: r.t_received ? new Date(r.t_received).toISOString() : null,
    tClassified: r.t_classified ? new Date(r.t_classified).toISOString() : null,
    tAlert: null,
  },
  createdAt: new Date(r.created_at).toISOString(),
});

export async function ingestChange(i: IngestInput): Promise<{ event: Event; jobId: number } | null> {
  const eventId = randomUUID();
  const raw = { ...i.raw, ...(i.contextId ? { contextId: i.contextId } : {}) };
  const out = await tx(async (c) => {
    const r = await c.query(
      `INSERT INTO event (id, via, source_url, monitor_ref, mode, is_test, content_hash, fetched_text, raw, t_source, t_received)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT DO NOTHING RETURNING *`,
      [eventId, i.via, i.sourceUrl, i.monitorRef ?? null, i.mode, i.isTest, i.contentHash, i.fetchedText, JSON.stringify(raw), i.tSource, i.tReceived],
    );
    if (!r.rows[0]) return null;
    const jobId = await enqueue("classify_event", { eventId }, { db: c });
    return { row: r.rows[0], jobId };
  });
  if (!out) return null;
  const event = mapEvent(out.row);
  await publish({ type: "event.received", data: { event } });
  return { event, jobId: out.jobId };
}

export async function listEvents(limit: number): Promise<Event[]> {
  const r = await pool.query(`SELECT * FROM event ORDER BY created_at DESC LIMIT $1`, [limit]);
  return r.rows.map(mapEvent);
}
