import type { Alert, Candidate, CheckResult, Event, Incident, SourceMode } from "@secondsource/shared";
import { companyFootprint, mapCompany, mapKey } from "../db/mappers";
import { pool, type Queryable } from "../db/pool";

/** Engine-side row -> contract mappers. */
const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

/**
 * Honest provenance for derived data: the LEAST live mode wins (SEED > LOCAL > REC > LIVE).
 * A LOCAL fetch classified by the SEED rule-based classifier is SEED, never LIVE.
 */
const LIVENESS: SourceMode[] = ["SEED", "LOCAL", "REC", "LIVE"];
export const leastLive = (modes: SourceMode[]): SourceMode => modes.reduce((a, b) => (LIVENESS.indexOf(b) < LIVENESS.indexOf(a) ? b : a), "LIVE" as SourceMode);

export function mapEvent(r: any): Event {
  return {
    id: r.id, via: r.via, sourceUrl: r.source_url, mode: r.mode, status: r.status, dropReason: r.drop_reason, isTest: r.is_test,
    latency: { tSource: iso(r.t_source), tReceived: iso(r.t_received), tClassified: iso(r.t_classified), tAlert: null },
    createdAt: iso(r.created_at)!,
  };
}

export async function loadEvent(id: string, db: Queryable = pool): Promise<Event | null> {
  const r = await db.query(`SELECT * FROM event WHERE id = $1`, [id]);
  return r.rows[0] ? mapEvent(r.rows[0]) : null;
}

export async function loadIncidents(opts: { id?: string; limit?: number } = {}, db: Queryable = pool): Promise<Incident[]> {
  const r = await db.query(
    `SELECT * FROM incident WHERE ($1::uuid IS NULL OR id = $1) ORDER BY created_at DESC LIMIT $2`,
    [opts.id ?? null, opts.limit ?? 50],
  );
  if (!r.rows.length) return [];
  const keys = await db.query(`SELECT * FROM footprint_key WHERE incident_id = ANY($1) ORDER BY type, value`, [r.rows.map((x) => x.id)]);
  return r.rows.map((i) => ({
    id: i.id, eventId: i.event_id, type: i.type, severity: i.severity, title: i.title, quote: i.quote, sourceUrl: i.source_url,
    confirmation: i.confirmation, footprint: keys.rows.filter((k) => k.incident_id === i.id).map(mapKey),
    unmappedNames: i.unmapped_names ?? [], mode: i.mode, isTest: i.is_test, createdAt: iso(i.created_at)!,
  }));
}

export async function loadAlerts(clientId: string, opts: { incidentId?: string; id?: string; limit?: number } = {}, db: Queryable = pool): Promise<Alert[]> {
  const r = await db.query(
    `SELECT a.*, i.type AS incident_type, i.severity, i.source_url, i.quote, i.mode AS imode, i.is_test,
            e.via, e.mode AS emode, e.t_source, e.t_received, e.t_classified,
            se.input_name, c.name AS company_name
     FROM alert a
     JOIN incident i ON i.id = a.incident_id
     JOIN event e ON e.id = i.event_id
     JOIN supplier_edge se ON se.id = a.edge_id
     LEFT JOIN company c ON c.id = se.company_id
     WHERE a.client_id = $1 AND ($2::uuid IS NULL OR a.incident_id = $2) AND ($3::uuid IS NULL OR a.id = $3)
     ORDER BY a.created_at DESC, a.id LIMIT $4`,
    [clientId, opts.incidentId ?? null, opts.id ?? null, opts.limit ?? 100],
  );
  return r.rows.map((a) => ({
    id: a.id, incidentId: a.incident_id, edgeId: a.edge_id, supplierName: a.company_name ?? a.input_name,
    incidentType: a.incident_type, severity: a.severity, matchedKeys: a.matched_keys, sourceUrl: a.source_url, quote: a.quote,
    latency: { tSource: iso(a.t_source), tReceived: iso(a.t_received), tClassified: iso(a.t_classified), tAlert: iso(a.t_alert) },
    via: a.via, mode: leastLive([a.imode, a.emode]), isTest: a.is_test, createdAt: iso(a.created_at)!,
  }));
}

const CHECK_ORDER = ["C1", "C2", "C3", "C4", "C5", "LIVE_NEWS"];

export async function loadCandidates(
  clientId: string, opts: { incidentId?: string; edgeId?: string; id?: string } = {}, db: Queryable = pool,
): Promise<Candidate[]> {
  const r = await db.query(
    `SELECT k.*, row_to_json(c.*) AS company FROM candidate k JOIN company c ON c.id = k.company_id
     WHERE k.client_id = $1 AND ($2::uuid IS NULL OR k.incident_id = $2) AND ($3::uuid IS NULL OR k.for_edge_id = $3) AND ($4::uuid IS NULL OR k.id = $4)
     ORDER BY k.rank NULLS LAST, c.name`,
    [clientId, opts.incidentId ?? null, opts.edgeId ?? null, opts.id ?? null],
  );
  if (!r.rows.length) return [];
  const checks = await db.query(`SELECT * FROM check_result WHERE candidate_id = ANY($1)`, [r.rows.map((x) => x.id)]);
  const fps = await companyFootprint(r.rows.map((x) => x.company_id), db);
  return r.rows.map((k) => ({
    id: k.id, incidentId: k.incident_id, forEdgeId: k.for_edge_id, company: mapCompany(k.company), footprint: fps.get(k.company_id) ?? [],
    checks: checks.rows
      .filter((c) => c.candidate_id === k.id)
      .sort((a, b) => CHECK_ORDER.indexOf(a.check_id) - CHECK_ORDER.indexOf(b.check_id))
      .map((c): CheckResult => ({ check: c.check_id, status: c.status, reason: c.reason, evidence: c.evidence ?? [] })),
    verdict: k.verdict, rank: k.rank, status: k.status, mode: k.mode, seeded: k.seeded,
  }));
}
