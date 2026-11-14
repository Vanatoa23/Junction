import { locate } from "@secondsource/shared";
import type { FootprintKey, FootprintType, ResolveOption, SourceMode, SupplierInput, SupplierStatus } from "@secondsource/shared";
import { UNKNOWN_VALUE } from "@secondsource/shared";
import { publish } from "../bus";
import { config } from "../config";
import { enqueue } from "../db/jobs";
import { mapCompany } from "../db/mappers";
import { pool, tx, type Queryable } from "../db/pool";
import { source } from "../source";
import { catalogByDomain } from "./demoCatalog";
import { lookupByDomain, lookupCandidates } from "./lookup";
import { decide, rank, type Candidate, type Scored } from "./scoring";
import { normalizeCountry, normalizeDomain } from "./similarity";

/**
 * Onboarding pipeline: PENDING -> RESOLVED -> MONITORED (or AMBIGUOUS / UNRESOLVED waiting for the user).
 * Jobs: resolve_supplier (resolve one row), extract_footprint (footprint rows, then register the watch).
 * Every state change publishes supplier.status.
 */
const MODE_RANK: Record<SourceMode, number> = { SEED: 0, LOCAL: 0, REC: 1, LIVE: 2 };
const OPTION_LIMIT = 5;
const OPTION_MIN_SCORE = 0.3;
const ALL_TYPES: FootprintType[] = ["REGION", "PORT", "PLANT", "PARENT", "SANCTION"];

async function emit(edgeId: string, status: SupplierStatus, mode: SourceMode | null, note: string | null) {
  await publish({ type: "supplier.status", data: { edgeId, status, mode, note } });
}

// ------------------------------------------------------------------ paste: create rows
export async function createPendingRows(clientId: string, inputs: SupplierInput[], db: Queryable = pool) {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of inputs) {
    const name = raw.name.trim().replace(/\s+/g, " ");
    const domain = normalizeDomain(raw.domain);
    const country = normalizeCountry(raw.country);
    const key = `${name.toLowerCase()}|${domain ?? ""}`;
    if (!name || seen.has(key)) continue; // same name+domain twice in one paste: one row
    seen.add(key);
    // optional facts the user typed (never required); kept as typed, shown back in the UI
    const details = Object.fromEntries(
      Object.entries({ supplies: raw.supplies, criticality: raw.criticality, annualSpendEur: raw.annualSpendEur, leadTimeDays: raw.leadTimeDays, contact: raw.contact, notes: raw.notes })
        .filter(([, v]) => v !== null && v !== undefined && v !== ""),
    );
    const r = await db.query(
      `INSERT INTO supplier_edge (client_id, tier, input_name, input_domain, input_country, input_city, details, status, mode, seeded)
       VALUES ($1, 1, $2, $3, $4, $5, $6, 'PENDING', 'SEED', false) RETURNING id`,
      [clientId, name, domain, country, raw.city?.trim() || null, JSON.stringify(details)],
    );
    ids.push(r.rows[0].id as string);
  }
  return ids;
}

export async function enqueueResolution(clientId: string, edgeIds: string[]) {
  for (const edgeId of edgeIds) {
    await enqueue("resolve_supplier", { edgeId }, { clientId });
    await emit(edgeId, "PENDING", null, "queued for resolution");
  }
}

// ------------------------------------------------------------------ resolve
async function loadEdge(edgeId: string, db: Queryable = pool) {
  const r = await db.query(`SELECT * FROM supplier_edge WHERE id = $1`, [edgeId]);
  return r.rows[0] as
    | { id: string; client_id: string; company_id: string | null; input_name: string; input_domain: string | null; input_country: string | null; status: SupplierStatus; resolve_options: ResolveOption[]; resolve_score: string | null }
    | undefined;
}

export async function resolveSupplier(edgeId: string) {
  const edge = await loadEdge(edgeId);
  if (!edge) throw new Error(`supplier_edge ${edgeId} not found`);
  if (edge.status !== "PENDING") return; // idempotent: a retry after success does nothing

  const input = { name: edge.input_name, domain: edge.input_domain, country: edge.input_country };
  const found = await lookupCandidates(input);
  const ranked = rank(input, found.candidates, found.answered.length);
  const decision = decide(ranked);
  const best = ranked[0];
  const bestScore = best ? best.breakdown.total : 0;

  if (decision.kind === "ACCEPT") {
    await finalizeResolved(edge.id, decision.best.candidate, decision.best.breakdown.total, `auto-accepted at score ${decision.best.breakdown.total}`);
    return;
  }

  const options = await toOptions(ranked);
  const status: SupplierStatus = decision.kind;
  const worst = options.length ? options.map((o) => o.mode).reduce((a, b) => (MODE_RANK[a] <= MODE_RANK[b] ? a : b)) : "SEED";
  await pool.query(
    `UPDATE supplier_edge SET status = $2, resolve_score = $3, resolve_options = $4, mode = $5, updated_at = now() WHERE id = $1`,
    [edge.id, status, bestScore, JSON.stringify(options), worst],
  );
  await emit(edge.id, status, worst, decision.kind === "AMBIGUOUS" ? `choose one of ${options.length}: ${decision.reason}` : `needs a domain: ${decision.reason}`);
}

/** Options for the chooser. companyId is filled when the company already exists; otherwise the chooser sends the domain. */
async function toOptions(ranked: Scored[]): Promise<ResolveOption[]> {
  const top = ranked.filter((s) => s.candidate.domain && s.breakdown.total >= OPTION_MIN_SCORE).slice(0, OPTION_LIMIT);
  if (!top.length) return [];
  const ex = await pool.query(`SELECT id, domain FROM company WHERE domain = ANY($1)`, [top.map((s) => s.candidate.domain)]);
  const idByDomain = new Map<string, string>(ex.rows.map((r) => [r.domain, r.id]));
  return top.map((s) => ({
    companyId: idByDomain.get(s.candidate.domain!) ?? null,
    name: s.candidate.name,
    domain: s.candidate.domain,
    country: s.candidate.country,
    score: s.breakdown.total,
    sourceUrls: s.candidate.sourceUrls,
    mode: s.candidate.mode,
  }));
}

/** Create/find the company, attach it, mark RESOLVED, queue footprint extraction. */
async function finalizeResolved(edgeId: string, c: Candidate, score: number | null, note: string, userTyped = false) {
  const domain = c.domain;
  if (!domain) throw new Error("cannot resolve to a company without a domain");
  const seeded = c.mode === "SEED" || userTyped;
  const urls = c.sourceUrls.length ? c.sourceUrls : [`https://${domain}`];
  const edgeRow = (await loadEdge(edgeId))!;
  const clientId = edgeRow.client_id;
  // where the supplier is: catalog city (seed world) > city the user typed > country centre (approximate)
  const place = locate(catalogByDomain(domain)?.city ?? (edgeRow as any).input_city, c.country ?? edgeRow.input_country);
  await tx(async (db) => {
    const co = await db.query(
      `INSERT INTO company (name, legal_name, domain, country, cala_id, seeded, mode, source_urls, category, city, lat, lng)
       VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (domain) DO UPDATE SET updated_at = now(), city = COALESCE(company.city, EXCLUDED.city), lat = COALESCE(company.lat, EXCLUDED.lat), lng = COALESCE(company.lng, EXCLUDED.lng)
       RETURNING id`,
      [c.name, domain, c.country, c.calaId, seeded, c.mode, urls, catalogByDomain(domain)?.category ?? null, place?.city ?? null, place?.lat ?? null, place?.lng ?? null],
    );
    const companyId = co.rows[0].id as string;
    await db.query(
      `UPDATE supplier_edge SET company_id = $2, status = 'RESOLVED', resolve_score = COALESCE($3, resolve_score), resolve_options = '[]',
         seeded = $4, mode = $5, source_urls = $6, updated_at = now() WHERE id = $1`,
      [edgeId, companyId, score, seeded, c.mode, urls],
    );
    await enqueue("extract_footprint", { companyId, edgeId }, { clientId, db });
  });
  await emit(edgeId, "RESOLVED", c.mode, note);
}

// ------------------------------------------------------------------ choose (chooser / needs-domain)
export class ChooseError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function chooseSupplier(edgeId: string, body: { companyId?: string; domain?: string }) {
  const edge = await loadEdge(edgeId);
  if (!edge) throw new ChooseError(404, "not_found");
  if (edge.status !== "AMBIGUOUS" && edge.status !== "UNRESOLVED") throw new ChooseError(409, `row is ${edge.status}, nothing to choose`);

  if (body.companyId) {
    const co = await pool.query(`SELECT * FROM company WHERE id = $1`, [body.companyId]);
    if (!co.rows[0]) throw new ChooseError(404, "company not found");
    const c = mapCompany(co.rows[0]);
    if (!c.domain) throw new ChooseError(409, "that company has no domain on record; supply one");
    await finalizeResolved(edge.id, {
      name: c.name, domain: c.domain, country: c.country, sources: [], calaId: c.calaId, sourceUrls: c.sourceUrls, mode: c.mode === "LOCAL" ? "SEED" : c.mode,
    }, null, "chosen by user");
    return;
  }

  const domain = normalizeDomain(body.domain);
  if (!domain) throw new ChooseError(400, "provide companyId or a valid domain");
  const option = edge.resolve_options.find((o) => o.domain === domain);
  let cand: Candidate | null = option
    ? { name: option.name, domain, country: option.country, sources: [], calaId: null, sourceUrls: option.sourceUrls, mode: option.mode }
    : await lookupByDomain(domain, edge.input_name);
  let userTyped = false;
  if (!cand) {
    // No source knows this domain: record what the user typed, flagged seeded (user-typed) and never CONFIRMED.
    cand = { name: edge.input_name, domain, country: normalizeCountry(edge.input_country), sources: [], calaId: null, sourceUrls: [`https://${domain}`], mode: "SEED" };
    userTyped = true;
  }
  await finalizeResolved(edge.id, cand, null, userTyped ? "domain typed by user; no source knows it" : "chosen by user", userTyped);
}

// ------------------------------------------------------------------ footprint
interface KeyRow { type: FootprintType; value: string; state: FootprintKey["state"]; sourceUrl: string | null; seeded: boolean; mode: SourceMode }

/** Pure: pad with UNKNOWN placeholders for every type with no data. */
export function withUnknownPlaceholders(keys: KeyRow[], mode: SourceMode): KeyRow[] {
  const out = [...keys];
  for (const t of ALL_TYPES) {
    if (!out.some((k) => k.type === t)) out.push({ type: t, value: UNKNOWN_VALUE, state: "UNKNOWN", sourceUrl: null, seeded: false, mode });
  }
  return out;
}

async function deriveKeys(co: ReturnType<typeof mapCompany>, domain: string): Promise<KeyRow[]> {
  const site = `https://${domain}/`;
  const cat = catalogByDomain(domain);
  const keys: KeyRow[] = [];
  if (cat && co.mode === "SEED") {
    for (const [type, value, state = "CONFIRMED"] of cat.keys) {
      keys.push({ type, value, state, sourceUrl: state === "UNKNOWN" ? null : site, seeded: true, mode: "SEED" });
    }
    return keys;
  }
  if (co.country) {
    // Headquarters country as reported by the resolver source. User-typed or seed data is INFERRED, seeded, no URL claimed.
    keys.push(co.mode === "SEED"
      ? { type: "REGION", value: co.country, state: "INFERRED", sourceUrl: null, seeded: true, mode: "SEED" }
      : { type: "REGION", value: co.country, state: "CONFIRMED", sourceUrl: site, seeded: false, mode: co.mode });
  }
  if (co.calaId) {
    const own = await source<any>({ provider: "cala", op: "ownership", params: { entityId: co.calaId } });
    const parent: unknown = own.ok ? own.data?.ultimateParent ?? own.data?.relationships?.outgoing?.IS_ULTIMATE_PARENT?.[0]?.id : null;
    if (typeof parent === "string" && parent) {
      const seedMode = own.mode === "SEED";
      keys.push({
        type: "PARENT", value: parent, state: "CONFIRMED",
        sourceUrl: seedMode ? null : own.sourceUrls[0] ?? `https://api.cala.ai/v1/entities/${encodeURIComponent(co.calaId)}`,
        seeded: seedMode, mode: own.mode,
      });
    }
  }
  return keys;
}

export async function extractFootprint(companyId: string, edgeId: string | null) {
  const cr = await pool.query(`SELECT * FROM company WHERE id = $1`, [companyId]);
  if (!cr.rows[0]) throw new Error(`company ${companyId} not found`);
  const co = mapCompany(cr.rows[0]);
  const existing = await pool.query(`SELECT count(*)::int AS n FROM footprint_key WHERE company_id = $1`, [companyId]);
  if (existing.rows[0].n === 0 && co.domain) {
    const keys = withUnknownPlaceholders(await deriveKeys(co, co.domain), co.mode);
    for (const k of keys) {
      await pool.query(
        `INSERT INTO footprint_key (company_id, type, value, state, source_url, seeded, mode) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [companyId, k.type, k.value, k.state, k.sourceUrl, k.seeded, k.mode],
      );
    }
  }
  if (!edgeId) return;
  await armWatch(edgeId);
}

/**
 * Registers the watch for a resolved supplier: a POLL registration row in supplier_edge.monitors, then MONITORED.
 * Ingest owns the actual polling. What is watched today is our own TEST notice page (Ingest's scrape-and-diff poll),
 * which is the only source that is genuinely polled in keyless mode. The UI says "poll", never a vendor monitor.
 * The Ingest thread can replace this seam with an arm_monitors job once that handler exists.
 */
export async function armWatch(edgeId: string) {
  const url = `${config.PUBLIC_BASE_URL}/test-notice`;
  const r = await pool.query(
    `UPDATE supplier_edge SET status = 'MONITORED', updated_at = now(),
       monitors = CASE WHEN monitors @> $2::jsonb THEN monitors ELSE monitors || $2::jsonb END
     WHERE id = $1 AND status IN ('RESOLVED','MONITORED') RETURNING mode`,
    [edgeId, JSON.stringify([{ url, kind: "POLL" }])],
  );
  if (!r.rows[0]) return;
  await emit(edgeId, "MONITORED", r.rows[0].mode, "watch registered: TEST notice page, poll");
}
