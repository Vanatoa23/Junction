import { config } from "../config";
import { pool } from "../db/pool";
import { DEMO_TRIGGER_TEXT } from "../seed/data";
import { loadAlerts, loadCandidates } from "./mappers";
import { runInline } from "./pipeline";

/**
 * Demo/dev script: what Ingest will do (an event row with fetched text), then the Engine pipeline inline.
 *   pnpm --filter @secondsource/api exec tsx --env-file-if-exists=../../.env src/engine/demo.ts ["custom notice text"]
 * The event is a TEST event (is_test, mode LOCAL: text we "fetched" from our own TEST page; the classifier
 * is the rule-based SEED one unless GEMINI_API_KEY is set). Prints what the UI will show.
 */
const text = process.argv[2] ?? DEMO_TRIGGER_TEXT;
const url = `${config.PUBLIC_BASE_URL}/test-notice`;
const ev = await pool.query(
  `INSERT INTO event (via, source_url, mode, is_test, fetched_text, t_received) VALUES ('POLL',$1,'LOCAL',true,$2,now()) RETURNING id`,
  [url, text],
);
const eventId = ev.rows[0].id as string;
const r = await runInline(eventId);
console.log("classify:", r);
if (r.outcome === "incident") {
  for (const a of await loadAlerts(config.DEMO_CLIENT_ID, { incidentId: r.incidentId })) {
    console.log(`ALERT ${a.supplierName} [${a.severity} ${a.incidentType}] mode=${a.mode} via=${a.via} quote="${a.quote}"`, a.latency);
    for (const c of await loadCandidates(config.DEMO_CLIENT_ID, { incidentId: r.incidentId, edgeId: a.edgeId })) {
      console.log(`  #${c.rank} ${c.company.name}: ${c.verdict}  ${c.checks.map((k) => `${k.check}=${k.status}`).join(" ")}`);
    }
  }
}
await pool.end();
