import { SaveDependencyRequest, incidentHeadline, type FootprintKey, type Incident, type SupplierDependency, type SupplierExposure } from "@secondsource/shared";
import { config } from "../config";
import { pool } from "../db/pool";
import { matchKeys } from "../engine/matching";
import type { ModuleDef } from "../module";

export async function loadDependencies(clientId: string, edgeId?: string): Promise<Map<string, SupplierDependency[]>> {
  const { rows } = await pool.query(
    `SELECT edge_id, id, parent_id, kind, name, match_key, source, source_url, confidence, verified_on::text
       FROM supplier_dependency WHERE client_id = $1 AND ($2::uuid IS NULL OR edge_id = $2)
       ORDER BY verified_on DESC, name, id`,
    [clientId, edgeId ?? null],
  );
  const byEdge = new Map<string, SupplierDependency[]>();
  for (const row of rows) {
    const links = byEdge.get(row.edge_id) ?? [];
    links.push({
      id: row.id, parentId: row.parent_id, kind: row.kind, name: row.name, matchKey: row.match_key,
      source: row.source, sourceUrl: row.source_url, confidence: row.confidence, verifiedOn: row.verified_on,
    });
    byEdge.set(row.edge_id, links);
  }
  return byEdge;
}

function save(clientId: string, edgeId: string, link: SaveDependencyRequest) {
  const key = link.kind === "SUPPLIER" ? link.name.toLowerCase().replace(/\s+/g, " ") : link.matchKey.toUpperCase();
  return pool.query(
    `INSERT INTO supplier_dependency (client_id, edge_id, parent_id, kind, name, match_key, source, source_url, confidence, verified_on)
     SELECT e.client_id, e.id, $3, $4, $5, $6, $7, $8, $9, $10
     FROM supplier_edge e
     WHERE e.client_id = $1 AND e.id = $2 AND e.tier = 1 AND e.company_id IS NOT NULL AND e.duplicate_of IS NULL
       AND ($3::uuid IS NULL OR EXISTS (
         SELECT 1 FROM supplier_dependency p WHERE p.client_id = $1 AND p.edge_id = e.id AND p.id = $3 AND p.kind = 'SUPPLIER'
       ))
     ON CONFLICT (client_id, edge_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, match_key) DO UPDATE SET
       name = EXCLUDED.name, source = EXCLUDED.source, source_url = EXCLUDED.source_url,
       confidence = EXCLUDED.confidence, verified_on = EXCLUDED.verified_on
     RETURNING id`,
    [clientId, edgeId, link.parentId, link.kind, link.name, key, link.source, link.sourceUrl, link.confidence, link.verifiedOn],
  );
}

export function dependencyEvidence(links: SupplierDependency[], incidents: Incident[]) {
  const byId = new Map(links.map((link) => [link.id, link]));
  const cutOff = new Date();
  cutOff.setUTCDate(cutOff.getUTCDate() - 365);
  const recent = cutOff.toISOString().slice(0, 10);
  const trustworthy = (link: SupplierDependency) => link.verifiedOn >= recent && link.confidence !== "LOW";
  const direct: FootprintKey[] = [];
  const upstream = new Map<string, FootprintKey[]>();
  const exposures: SupplierExposure[] = [];
  let hasPort = false;
  let hasPlant = false;
  let hasUpstreamEvidence = false;

  for (const link of links) if (link.kind === "SUPPLIER") upstream.set(link.id, []);

  for (const link of links) {
    if (link.kind === "SUPPLIER") continue;
    const path = [link];
    let parent = link.parentId && byId.get(link.parentId);
    while (parent) {
      path.push(parent);
      parent = parent.parentId && byId.get(parent.parentId);
    }
    path.reverse();
    const reliable = path.every(trustworthy);
    if (link.kind === "PORT") hasPort ||= reliable;
    if (link.kind === "PLANT") hasPlant ||= reliable;
    hasUpstreamEvidence ||= path.length > 1 && reliable;
    const key: FootprintKey = {
      type: link.kind, value: link.matchKey,
      state: path.every((step) => trustworthy(step) && step.confidence === "HIGH") ? "CONFIRMED" : "INFERRED",
      sourceUrl: link.sourceUrl, sourceQuote: null, seeded: !link.sourceUrl,
    };
    if (link.parentId) upstream.get(link.parentId)?.push(key);
    else direct.push(key);
    for (const incident of incidents) {
      if (matchKeys(incident.footprint, [key]).length) {
        exposures.push({ incidentId: incident.id, headline: incidentHeadline(incident.type, incident.footprint), path });
      }
    }
  }

  return {
    direct, exposures,
    deeper: [...upstream].map(([id, keys]) => ({ tier: byId.get(id)!.parentId ? 3 : 2, keys })),
    limited: !(hasPort && hasPlant && hasUpstreamEvidence),
  };
}

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const mod: ModuleDef = {
  name: "dependencies",
  registerRoutes(app) {
    app.get<{ Params: { edgeId: string } }>("/suppliers/:edgeId/dependencies", async (req, reply) => {
      const { edgeId } = req.params;
      if (!uuid.test(edgeId)) return reply.code(400).send({ error: "Invalid supplier ID." });
      const clientId = config.DEMO_CLIENT_ID;
      const { rowCount } = await pool.query(
        "SELECT 1 FROM supplier_edge WHERE id = $1 AND client_id = $2 AND tier = 1 AND duplicate_of IS NULL",
        [edgeId, clientId],
      );
      if (!rowCount) return reply.code(404).send({ error: "Supplier not found." });
      return { dependencies: (await loadDependencies(clientId, edgeId)).get(edgeId) ?? [] };
    });
    app.put<{ Params: { edgeId: string } }>("/suppliers/:edgeId/dependencies", async (req, reply) => {
      const { edgeId } = req.params;
      if (!uuid.test(edgeId)) return reply.code(400).send({ error: "Invalid supplier ID." });
      const input = SaveDependencyRequest.safeParse(req.body);
      if (!input.success) return reply.code(400).send({ error: input.error.issues[0]?.message ?? "Check the dependency details." });
      if (input.data.verifiedOn > new Date().toISOString().slice(0, 10)) {
        return reply.code(400).send({ error: "The verification date cannot be in the future." });
      }
      const result = await save(config.DEMO_CLIENT_ID, edgeId, input.data);
      if (!result.rowCount) return reply.code(404).send({ error: "Supplier or parent dependency not found." });
      return { dependencies: (await loadDependencies(config.DEMO_CLIENT_ID, edgeId)).get(edgeId) ?? [] };
    });
    app.delete<{ Params: { edgeId: string; id: string } }>("/suppliers/:edgeId/dependencies/:id", async (req, reply) => {
      const { edgeId, id } = req.params;
      if (!uuid.test(edgeId) || !uuid.test(id)) return reply.code(400).send({ error: "Invalid dependency ID." });
      const result = await pool.query("DELETE FROM supplier_dependency WHERE client_id = $1 AND edge_id = $2 AND id = $3", [config.DEMO_CLIENT_ID, edgeId, id]);
      if (!result.rowCount) return reply.code(404).send({ error: "Dependency not found." });
      return reply.code(204).send();
    });
  },
};
export default mod;
