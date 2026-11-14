import type { FastifyInstance } from "fastify";
import { ApproveCandidateRequest } from "@secondsource/shared";
import { config } from "../config";
import { enqueue } from "../db/jobs";
import { pool, tx } from "../db/pool";
import { approveCandidate } from "./approve";
import { loadAlerts, loadCandidates, loadEvent, loadIncidents } from "./mappers";
import { MapIncidentRequest } from "./schemas";

const lim = (v: unknown, d: number) => Math.min(Math.max(parseInt(String(v ?? ""), 10) || d, 1), 500);

export function registerEngineRoutes(app: FastifyInstance) {
  const clientId = config.DEMO_CLIENT_ID;

  app.get<{ Querystring: { limit?: string } }>("/alerts", async (req) => ({ alerts: await loadAlerts(clientId, { limit: lim(req.query.limit, 100) }) }));

  app.get<{ Querystring: { limit?: string } }>("/incidents", async (req) => ({ incidents: await loadIncidents({ limit: lim(req.query.limit, 50) }) }));

  app.get<{ Params: { id: string } }>("/incidents/:id", async (req, reply) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return reply.code(400).send({ error: "bad_id" });
    const [incident] = await loadIncidents({ id: req.params.id });
    if (!incident) return reply.code(404).send({ error: "not_found" });
    const event = await loadEvent(incident.eventId);
    const alerts = await loadAlerts(clientId, { incidentId: incident.id });
    // event.latency.tAlert = first alert time, so the UI can show the whole chain from one object
    const first = alerts.map((a) => a.latency.tAlert).filter(Boolean).sort()[0] ?? null;
    return { incident, event: { ...event!, latency: { ...event!.latency, tAlert: first } }, alerts };
  });

  app.get<{ Params: { id: string }; Querystring: { edgeId?: string; limit?: string } }>("/incidents/:id/alternatives", async (req, reply) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return reply.code(400).send({ error: "bad_id" });
    const edgeId = req.query.edgeId && /^[0-9a-f-]{36}$/i.test(req.query.edgeId) ? req.query.edgeId : undefined;
    let candidates = await loadCandidates(clientId, { incidentId: req.params.id, edgeId });
    if (req.query.limit) candidates = candidates.slice(0, lim(req.query.limit, 3));
    const pending = await pool.query(
      `SELECT 1 FROM job WHERE kind = 'find_alternatives' AND status IN ('queued','running') AND payload->>'incidentId' = $1 AND ($2::text IS NULL OR payload->>'edgeId' = $2) LIMIT 1`,
      [req.params.id, edgeId ?? null],
    );
    return { ready: pending.rows.length === 0, candidates };
  });

  app.post<{ Params: { id: string } }>("/candidates/:id/approve", async (req, reply) => {
    const body = ApproveCandidateRequest.safeParse(req.body ?? {});
    if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
    const r = await approveCandidate(clientId, req.params.id, body.data);
    if (!r.ok) return reply.code(r.status).send({ error: r.error, detail: r.detail });
    return { candidate: r.candidate, audit: r.audit };
  });

  // A person maps names the system could not resolve, then matching re-runs.
  app.post<{ Params: { id: string } }>("/incidents/:id/mapping", async (req, reply) => {
    const body = MapIncidentRequest.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
    const [incident] = await loadIncidents({ id: req.params.id });
    if (!incident) return reply.code(404).send({ error: "not_found" });
    await tx(async (c) => {
      for (const k of body.data.keys) {
        await c.query(
          `INSERT INTO footprint_key (incident_id, type, value, state, source_url, seeded, mode) VALUES ($1,$2,$3,'CONFIRMED',NULL,true,'SEED') ON CONFLICT DO NOTHING`,
          [incident.id, k.type, k.value.trim()],
        );
      }
      await c.query(`UPDATE incident SET unmapped_names = '{}' WHERE id = $1`, [incident.id]);
    });
    await enqueue("match_incident", { incidentId: incident.id });
    const [updated] = await loadIncidents({ id: incident.id });
    return reply.code(202).send({ incident: updated });
  });
}
