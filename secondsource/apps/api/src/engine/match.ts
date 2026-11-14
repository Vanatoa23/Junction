import { pool } from "../db/pool";
import { companyFootprint } from "../db/mappers";
import { defaultDeps, type EngineDeps } from "./deps";
import { matchKeys } from "./matching";
import { loadAlerts, loadIncidents } from "./mappers";

export type MatchOutcome =
  | { outcome: "alerted"; alertIds: string[] }
  | { outcome: "blocked"; reason: string }
  | { outcome: "no_match" };

/**
 * Job match_incident. Incident footprint vs every client's tier-1 suppliers (nested regions).
 * One alert per (incident, supplier), t_alert recorded by the DB, alert.created published,
 * find_alternatives enqueued per alert.
 * BLOCKED (no alert, surfaces for a human; see POST /incidents/:id/mapping):
 *   - unmappedNames non-empty (a place/company we could not resolve)
 *   - incident UNCONFIRMED (only confirmed incidents are pushed to clients)
 *   - no usable footprint keys
 */
export async function matchIncident(incidentId: string, deps: EngineDeps = defaultDeps): Promise<MatchOutcome> {
  const [incident] = await loadIncidents({ id: incidentId });
  if (!incident) throw new Error(`incident ${incidentId} not found`);

  const block = (reason: string): MatchOutcome => {
    deps.log(`incident ${incidentId}: no auto-alert, ${reason}`);
    return { outcome: "blocked", reason };
  };
  if (incident.unmappedNames.length) return block(`needs human mapping: ${incident.unmappedNames.join(", ")}`);
  if (incident.confirmation !== "CONFIRMED") return block("incident is UNCONFIRMED (not pushed to clients)");
  if (!incident.footprint.some((k) => k.state !== "UNKNOWN")) return block("incident has no footprint keys");

  const edges = (
    await pool.query(
      `SELECT id, client_id, company_id FROM supplier_edge
       WHERE tier = 1 AND company_id IS NOT NULL AND status IN ('RESOLVED','MONITORED') ORDER BY created_at, id`,
    )
  ).rows;
  const fps = await companyFootprint(edges.map((e) => e.company_id));

  const alertIds: string[] = [];
  // Pasting the same supplier twice creates two edges to ONE company: alert once per (client, company).
  const alerted = new Set<string>();
  for (const e of edges) {
    const dedupe = `${e.client_id}|${e.company_id}`;
    if (alerted.has(dedupe)) continue;
    const matched = matchKeys(incident.footprint, fps.get(e.company_id) ?? []);
    if (!matched.length) continue;
    alerted.add(dedupe);
    const ins = await pool.query(
      `INSERT INTO alert (client_id, incident_id, edge_id, matched_keys) VALUES ($1,$2,$3,$4)
       ON CONFLICT (client_id, incident_id, edge_id) DO NOTHING RETURNING id`,
      [e.client_id, incidentId, e.id, JSON.stringify(matched)],
    );
    if (!ins.rows[0]) continue; // already alerted (job retried)
    const id = ins.rows[0].id as string;
    alertIds.push(id);
    const [alert] = await loadAlerts(e.client_id, { id });
    try {
      await deps.publish({ type: "alert.created", data: { alert: alert! } });
    } catch (err) {
      deps.log(`alert ${id}: SSE publish failed (${(err as Error).message}); alert is stored, feed will pick it up via GET /alerts`);
    }
    await deps.enqueue("find_alternatives", { incidentId, edgeId: e.id }, { clientId: e.client_id });
  }
  deps.log(`incident ${incidentId}: ${alertIds.length} alert(s)`);
  return alertIds.length ? { outcome: "alerted", alertIds } : { outcome: "no_match" };
}
