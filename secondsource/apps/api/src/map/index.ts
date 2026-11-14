import { z } from "zod";
import { Criticality, PORTS, SnapSupplierRequest, incidentHeadline, incidentPoint, locate, placeLabel, UpdateProfileRequest, type MapIncident, type MapResponse, type MapSupplier } from "@secondsource/shared";
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
const DEMO_NOTICE_FICTIONAL =
  "NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.";

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

  // known facilities (data pack): grouped per company; positions are the country centre when only the country is known
  const siteRows = (await pool.query(`SELECT company_id, country, count(*)::int AS n FROM site WHERE company_id = ANY($1) GROUP BY company_id, country ORDER BY n DESC, country`, [suppliers.map((x) => x.company?.id).filter(Boolean)])).rows;
  const sitesOf = new Map<string, MapSupplier["sites"]>();
  for (const r of siteRows) {
    const pt = locate(null, r.country);
    sitesOf.set(r.company_id, [...(sitesOf.get(r.company_id) ?? []), { country: r.country.trim(), count: r.n, lat: pt?.lat ?? null, lng: pt?.lng ?? null }]);
  }

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
      sites: company ? sitesOf.get(company.id) ?? [] : [],
      anonymised: /^(Supplier|Company|Buyer)-/.test(company?.name ?? s.input.name),
      exposures: evidence.exposures,
      alert: latest && inc ? { alertId: latest.id, incidentId: latest.incidentId, headline: incidentHeadline(inc.type, inc.footprint), severity: latest.severity } : null,
    };
  });

  // Suppliers that are only known by country share one point (the country centre): spread them on a small ring so they stay
  // separate and clickable. Still "approximate location".
  const sharing = new Map<string, MapSupplier[]>();
  for (const m of out) if (m.precision === "COUNTRY" && m.lat != null && m.lng != null) sharing.set(`${m.lat},${m.lng}`, [...(sharing.get(`${m.lat},${m.lng}`) ?? []), m]);
  for (const group of sharing.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.edgeId.localeCompare(b.edgeId)).forEach((m, i) => {
      const a = (2 * Math.PI * i) / group.length;
      m.lat = m.lat! + 1.6 * Math.sin(a);
      m.lng = m.lng! + 2.2 * Math.cos(a);
    });
  }

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

  // ports that matter now: used by a direct supplier (own or assumed) or named by an open incident. Anchors, not suppliers.
  const wanted = new Set<string>();
  for (const sup of suppliers) for (const k of sup.footprint) if (k.type === "PORT" && k.state !== "UNKNOWN") wanted.add(k.value);
  for (const inc of incidents) for (const k of inc.footprint) if (k.type === "PORT") wanted.add(k.value);
  const dbPorts = wanted.size ? (await pool.query(`SELECT id, name, lat, lng FROM port WHERE id = ANY($1) AND lat IS NOT NULL`, [[...wanted]])).rows : [];
  const dbPort = new Map<string, { lat: number; lng: number }>(dbPorts.map((r) => [r.id, { lat: r.lat, lng: r.lng }]));
  const ports: MapResponse["ports"] = [];
  for (const id of wanted) {
    const at = PORTS[id] ?? dbPort.get(id);
    if (at) ports.push({ id, label: placeLabel("PORT", id), lat: at.lat, lng: at.lng });
  }
  for (const mi of mapIncidents) {
    if (mi.point) continue;
    const inc = incidentById.get(mi.id);
    const port = inc?.footprint.find((k) => k.type === "PORT" && dbPort.has(k.value));
    if (port) mi.point = { ...dbPort.get(port.value)!, label: placeLabel("PORT", port.value) };
  }

  const hub = client ?? { name: "Your company", city: null, country: null, lat: null, lng: null };
  return {
    hub: { name: hub.name, city: hub.city, country: hub.country?.trim() || null, lat: hub.lat, lng: hub.lng },
    suppliers: out, incidents: mapIncidents, ports,
    demo: { noticeText: client?.demo_notice ?? DEMO_NOTICE_FICTIONAL, noticeLabel: client?.demo_label ?? "Strike at the Port of Rotterdam" },
    scenario: client?.scenario ?? "fictional",
  };
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
    // Known companies from the data pack, so a new supplier can snap to a real record (name, city, country) instead of being looked up.
    app.get<{ Querystring: { q?: string; country?: string; city?: string } }>("/known", async (req) => {
      const q = (req.query.q ?? "").trim();
      const country = (req.query.country ?? "").trim().toUpperCase();
      const city = (req.query.city ?? "").trim();
      if (!q && !country && !city) return { companies: [] };
      const r = await pool.query(
        `SELECT c.id, c.name, c.city, c.country, c.category, (SELECT count(*)::int FROM site s WHERE s.company_id = c.id) AS sites
         FROM company c
         WHERE c.mode = 'REC' AND NOT c.seeded
           AND ($1 = '' OR c.name ILIKE '%' || $1 || '%')
           AND ($2 = '' OR c.country = $2)
           AND ($3 = '' OR c.city ILIKE $3 || '%')
           AND NOT EXISTS (SELECT 1 FROM supplier_edge e WHERE e.client_id = $4 AND e.tier = 1 AND e.company_id = c.id)
         ORDER BY (c.city IS NOT NULL) DESC, (SELECT count(*) FROM site s WHERE s.company_id = c.id) DESC, c.name
         LIMIT 8`,
        [q, country, city, config.DEMO_CLIENT_ID],
      );
      return { companies: r.rows.map((x) => ({ companyId: x.id, name: x.name, city: x.city, country: x.country?.trim() ?? null, category: x.category, sites: x.sites, anonymised: /^(Supplier|Company|Buyer)-/.test(x.name) })) };
    });
    app.post("/suppliers/snap", async (req, reply) => {
      const body = SnapSupplierRequest.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
      const co = (await pool.query(`SELECT * FROM company WHERE id = $1 AND mode = 'REC' AND NOT seeded`, [body.data.companyId])).rows[0];
      if (!co) return reply.code(404).send({ error: "not_found", detail: "no such known company" });
      const dup = await pool.query(`SELECT 1 FROM supplier_edge WHERE client_id = $1 AND tier = 1 AND company_id = $2`, [config.DEMO_CLIENT_ID, co.id]);
      if (dup.rowCount) return reply.code(409).send({ error: "already_added", detail: "this company is already one of your suppliers" });
      const { name, companyId: _c, ...rest } = body.data;
      const details: Record<string, unknown> = { _pack: "snapped" };
      for (const [k, v] of Object.entries(rest)) if (v !== undefined && v !== null && v !== "") details[k] = v;
      const created = await pool.query(
        `INSERT INTO supplier_edge (client_id, tier, company_id, input_name, input_country, input_city, status, monitors, resolve_score, seeded, mode, source_urls, details)
         VALUES ($1,1,$2,$3,$4,$5,'MONITORED',$6,1.000,false,$7,$8,$9) RETURNING id`,
        [config.DEMO_CLIENT_ID, co.id, name ?? co.name, co.country?.trim() ?? null, co.city, JSON.stringify([{ url: `${config.PUBLIC_BASE_URL}/test-notice`, kind: "POLL" }]), co.mode, co.source_urls ?? [], JSON.stringify(details)],
      );
      return reply.code(201).send({ edgeId: created.rows[0].id as string, map: await buildMap(config.DEMO_CLIENT_ID) });
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
