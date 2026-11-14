import { ClassifyOutput, type ClassifiedKey } from "@secondsource/shared";
import { pool, tx } from "../db/pool";
import { verifyQuote } from "../lib/quote";
import { setExtraPorts } from "../seed/gazetteer";
import { defaultDeps, type EngineDeps } from "./deps";

export type ClassifyOutcome =
  | { outcome: "incident"; incidentId: string }
  | { outcome: "not_incident"; reason: string }
  | { outcome: "dropped"; reason: string }
  | { outcome: "skipped"; reason: string };

/**
 * Job classify_event. Event (RECEIVED) -> classifier -> verbatim quote check IN CODE -> incident.
 *  - classifier says not an incident: event CLASSIFIED (logged, no incident)
 *  - quote not a substring of fetched_text, or output invalid: event DROPPED with drop_reason (logged)
 *  - ok: incident + footprint keys, event INCIDENT, t_classified set, match_incident enqueued
 * Key-level quotes are verified too; a key whose quote fails is dropped (we cannot trust it).
 * Incident confirmation: the TEST page plays the role of an official notice, so TEST incidents are CONFIRMED;
 * everything else stays UNCONFIRMED (never pushed to clients) until a corroboration step exists.
 */
export async function classifyEvent(eventId: string, deps: EngineDeps = defaultDeps): Promise<ClassifyOutcome> {
  const ev = (await pool.query(`SELECT * FROM event WHERE id = $1`, [eventId])).rows[0];
  if (!ev) throw new Error(`event ${eventId} not found`);
  if (ev.status !== "RECEIVED") return { outcome: "skipped", reason: `event already ${ev.status}` };

  const finish = (status: "CLASSIFIED" | "DROPPED", reason: string | null) =>
    pool.query(`UPDATE event SET status = $2, drop_reason = $3, t_classified = now() WHERE id = $1`, [eventId, status, reason]);
  const drop = async (reason: string): Promise<ClassifyOutcome> => {
    await finish("DROPPED", reason);
    deps.log(`event ${eventId} DROPPED: ${reason}`);
    return { outcome: "dropped", reason };
  };

  const text: string = ev.fetched_text ?? "";
  if (!text.trim()) return drop("no fetched text to classify");

  await refreshExtraPorts();
  const res = await deps.classify(text, ev.source_url);
  if (!res.ok) throw new Error(`classifier unavailable: ${res.note}`); // job retries with backoff
  const parsed = ClassifyOutput.safeParse(res.data);
  if (!parsed.success) return drop(`classifier output invalid: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`);
  const out = parsed.data;

  if (!out.incident) {
    await finish("CLASSIFIED", null);
    deps.log(`event ${eventId}: not an incident (${out.reason})`);
    return { outcome: "not_incident", reason: out.reason };
  }

  if (!verifyQuote(text, out.quote)) return drop(`quote not found in fetched text: "${out.quote.slice(0, 120)}"`);

  const keys: ClassifiedKey[] = [];
  for (const k of out.keys) {
    if (k.quote && !verifyQuote(text, k.quote)) {
      deps.log(`event ${eventId}: dropped key ${k.type}:${k.value} (its quote is not in the text)`);
      continue;
    }
    keys.push(k);
  }

  const incidentId = await tx(async (c) => {
    const inc = await c.query(
      `INSERT INTO incident (event_id, type, severity, title, quote, quote_verified, source_url, confirmation, unmapped_names, mode, is_test)
       VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,$9,$10) RETURNING id`,
      [eventId, out.type, out.severity, out.title, out.quote, ev.source_url, ev.is_test ? "CONFIRMED" : "UNCONFIRMED", out.unmappedNames, res.mode, ev.is_test],
    );
    const id = inc.rows[0].id as string;
    for (const k of keys) {
      await c.query(
        `INSERT INTO footprint_key (incident_id, type, value, state, source_url, source_quote, seeded, mode)
         VALUES ($1,$2,$3,$4,$5,$6,false,$7) ON CONFLICT DO NOTHING`,
        [id, k.type, k.value, k.state, ev.source_url, k.quote, res.mode],
      );
    }
    await c.query(`UPDATE event SET status = 'INCIDENT', drop_reason = NULL, t_classified = now() WHERE id = $1`, [eventId]);
    return id;
  });

  await deps.enqueue("match_incident", { incidentId });
  deps.log(`event ${eventId} -> incident ${incidentId} (${out.type}/${out.severity}, ${keys.length} keys, classifier ${out.classifier}, mode ${res.mode})`);
  return { outcome: "incident", incidentId };
}

/** Public-pack ports teach the rule-based classifier new port names (cached for a minute). */
let portsLoadedAt = 0;
async function refreshExtraPorts() {
  if (Date.now() - portsLoadedAt < 60_000) return;
  portsLoadedAt = Date.now();
  try {
    setExtraPorts((await pool.query(`SELECT id, name FROM port`)).rows);
  } catch {
    /* no port table (older database): the built-in ports still work */
  }
}
