import { z } from "zod";
import { Criticality, incidentHeadline, incidentPoint, locate, UpdateProfileRequest, type MapIncident, type MapResponse, type MapSupplier } from "@secondsource/shared";
import { config } from "../config";
import { companyFootprint, loadSuppliers } from "../db/mappers";
import { pool } from "../db/pool";
import { loadAlerts, loadIncidents } from "../engine/mappers";
import type { ModuleDef } from "../module";
import { scoreSupplier, type DeeperNode } from "./risk";
import { dependencyEvidence, loadDependencies } from "./dependencies";

/**
 * OWNER: Foundation / integrator. Read-only view for the web app's map and dashboard.
 *  GET /map      hub + DIRECT suppliers (position, plain-language risk with reasons, latest alert) + open incidents
 *  PUT /profile  our own company name and city (the hub on the map)
 *  PUT /suppliers/:edgeId/details  add or change the optional facts about a supplier (null/empty clears one)
 * Seeded deeper tiers feed risk. Matching buyer-confirmed paths explain exposure on the supplier card.
 */
const OPEN_DAYS = 7;

export async function buildMap(clientId: string): Promise<MapResponse> {
  const client = (await pool.query(`SELECT * FROM client WHERE id = $1`, [clientId])).rows[0];
  const [suppliers, dependencyLinks] = await Promise.all([loadSuppliers(clientId), loadDependencies(clientId)]);

  // deeper tiers: companies reachable from each direct supplier through tier >= 2 edges
  const deepEdges = (await pool.query(`SELECT company_id, buyer_company_id, tier FROM supplier_edge WHERE client_id = $1 AND tier >= 2 AND company_id IS NOT NULL AND buyer_company_id IS NOT NULL`, [clientId])).rows;
  const fps = await companyFootprint(deepEdges.map((e) => e.company_id));
  const children = new Map<string, Array<{ company_id: string; tier: number }>>();
  for (const e of deepEdges) children.set(e.buyer_company_id, [...(children.get(e.buyer_company_id) ?? []), { company_id: e.company_id, tier: e.tier }]);
  const deeperOf = (companyId: string): DeeperNode[] => {
    const out: DeeperNode[] = [];
    const seen = new Set<string>([companyId]);
    const walk = (id: string) => {
      for (const c of children.get(id) ?? []) {
        if (seen.has(c.company_id)) continue;
        seen.add(c.company_id);
        out.push({ tier: c.tier, keys: fps.get(c.company_id) ?? [] });
        walk(c.company_id);
      }
    };
    walk(companyId);
    return out;
  };

  const since = Date.now() - OPEN_DAYS * 86400_000;
  const incidents = (await loadIncidents({ limit: 50 })).filter((i) => i.confirmation === "CONFIRMED" && i.unmappedNames.length === 0 && Date.parse(i.createdAt) >= since);
  const alerts = await loadAlerts(clientId, { limit: 200 });
  const incidentById = new Map(incidents.map((i) => [i.id, i]));

  const out: MapSupplier[] = suppliers.map((s) => {
    const company = s.company;
    const place =
      company?.lat != null && company?.lng != null
        ? { lat: company.lat, lng: company.lng, precision: "CITY" as const, city: company.city ?? s.input.city }
        : locate(s.input.city, s.input.country ?? company?.country);
    const evidence = dependencyEvidence(dependencyLinks.get(s.edgeId) ?? [], incidents);
    const own = [...evidence.direct, ...s.footprint];
    const deeper = [...(company ? deeperOf(company.id) : []), ...evidence.deeper];
    const risk = scoreSupplier(own, deeper, incidents, evidence.limited);
    const latest = alerts.find((a) => a.edgeId === s.edgeId && incidentById.has(a.incidentId));
    const inc = latest ? incidentById.get(latest.incidentId)! : null;
    return {
      edgeId: s.edgeId,
      name: company?.name ?? s.input.name,
      status: s.status,
      country: company?.country ?? s.input.country,
      city: place?.city ?? s.input.city ?? null,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      precision: place?.precision ?? null,
      category: company?.category ?? null,
      supplies: s.input.supplies,
      criticality: s.input.criticality,
      annualSpendEur: s.input.annualSpendEur,
      leadTimeDays: s.input.leadTimeDays,
      risk,
      exposures: evidence.exposures,
      alert: latest && inc ? { alertId: latest.id, incidentId: latest.incidentId, headline: incidentHeadline(inc.type, inc.footprint), severity: latest.severity } : null,
    };
  });

  const mapIncidents: MapIncident[] = incidents.map((i) => {
    const mine = alerts.filter((a) => a.incidentId === i.id);
    const first = mine[0];
    const exposureCount = out.filter((s) => s.exposures.some((exposure) => exposure.incidentId === i.id) && !mine.some((alert) => alert.edgeId === s.edgeId)).length;
    const tSource = first?.latency.tSource ? Date.parse(first.latency.tSource) : null;
    const tAlert = first?.latency.tAlert ? Date.parse(first.latency.tAlert) : null;
    return {
      id: i.id, headline: incidentHeadline(i.type, i.footprint), type: i.type, severity: i.severity, createdAt: i.createdAt,
      affected: [...new Set(mine.map((a) => a.supplierName))], point: incidentPoint(i.footprint), isTest: i.isTest, sourceUrl: i.sourceUrl, quote: i.quote,
      exposureCount,
      noticedInSeconds: tSource !== null && tAlert !== null ? Math.max(0, Math.round((tAlert - tSource) / 1000)) : null,
    };
  });

  const hub = client ?? { name: "Your company", city: null, country: null, lat: null, lng: null };
  return { hub: { name: hub.name, city: hub.city, country: hub.country?.trim() || null, lat: hub.lat, lng: hub.lng }, suppliers: out, incidents: mapIncidents };
}

const mod: ModuleDef = {
  name: "map",
  registerRoutes(app) {
    app.get("/map", async () => buildMap(config.DEMO_CLIENT_ID));
    const Details = z.object({
      city: z.string().nullable().optional(), supplies: z.string().nullable().optional(), criticality: Criticality.nullable().optional(),
      annualSpendEur: z.number().nonnegative().nullable().optional(), leadTimeDays: z.number().int().nonnegative().nullable().optional(),
      contact: z.string().nullable().optional(), notes: z.string().nullable().optional(),
    });
    app.put<{ Params: { edgeId: string } }>("/suppliers/:edgeId/details", async (req, reply) => {
      if (!/^[0-9a-f-]{36}$/i.test(req.params.edgeId)) return reply.code(400).send({ error: "bad_id" });
      const body = Details.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
      const cur = (await pool.query(`SELECT details, input_city FROM supplier_edge WHERE id = $1 AND client_id = $2 AND tier = 1 AND duplicate_of IS NULL`, [req.params.edgeId, config.DEMO_CLIENT_ID])).rows[0];
      if (!cur) return reply.code(404).send({ error: "not_found" });
      const { city, ...rest } = body.data;
      const details: Record<string, unknown> = { ...(cur.details ?? {}) };
      for (const [k, v] of Object.entries(rest)) {
        if (v === undefined) continue;
        if (v === null || v === "") delete details[k];
        else details[k] = v;
      }
      await pool.query(`UPDATE supplier_edge SET details = $2, input_city = $3, updated_at = now() WHERE id = $1`, [req.params.edgeId, JSON.stringify(details), city === undefined ? cur.input_city : city?.trim() || null]);
      return buildMap(config.DEMO_CLIENT_ID);
    });
    app.put("/profile", async (req, reply) => {
      const body = UpdateProfileRequest.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
      const cur = (await pool.query(`SELECT * FROM client WHERE id = $1`, [config.DEMO_CLIENT_ID])).rows[0];
      const name = body.data.name ?? cur.name;
      const city = body.data.city !== undefined ? body.data.city : cur.city;
      const country = body.data.country !== undefined ? body.data.country : cur.country;
      const p = locate(city, country);
      await pool.query(`UPDATE client SET name = $2, city = $3, country = $4, lat = $5, lng = $6 WHERE id = $1`, [config.DEMO_CLIENT_ID, name, city, country, p?.lat ?? null, p?.lng ?? null]);
      return buildMap(config.DEMO_CLIENT_ID);
    });
  },
};
export default mod;
