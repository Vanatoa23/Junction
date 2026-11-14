import type { Company, FootprintKey, SupplierInput, SupplierRow } from "@secondsource/shared";
import { pool, type Queryable } from "./pool";

/**
 * Shared row -> contract mappers (Foundation-owned). Use these instead of
 * re-mapping columns in each module so the contract shape stays in one place.
 */
const iso = (d: Date | string) => new Date(d).toISOString();

export function mapCompany(r: any): Company {
  return {
    id: r.id, name: r.name, legalName: r.legal_name, domain: r.domain, country: r.country?.trim() || null,
    category: r.category, calaId: r.cala_id, parentCompanyId: r.parent_company_id, city: r.city ?? null, lat: r.lat ?? null, lng: r.lng ?? null,
    inCandidatePool: r.in_candidate_pool, seeded: r.seeded, mode: r.mode, sourceUrls: r.source_urls ?? [],
  };
}

export function mapKey(r: any): FootprintKey {
  return { type: r.type, value: r.value, state: r.state, sourceUrl: r.source_url, sourceQuote: r.source_quote, seeded: r.seeded };
}

export async function companyFootprint(companyIds: string[], db: Queryable = pool): Promise<Map<string, FootprintKey[]>> {
  const out = new Map<string, FootprintKey[]>();
  if (!companyIds.length) return out;
  const r = await db.query(`SELECT * FROM footprint_key WHERE company_id = ANY($1) ORDER BY type, value`, [companyIds]);
  for (const row of r.rows) {
    const list = out.get(row.company_id) ?? [];
    list.push(mapKey(row));
    out.set(row.company_id, list);
  }
  return out;
}

/** supplier_edge row -> SupplierInput (typed facts live in `details`). */
export function edgeInput(e: any): SupplierInput {
  const d = e.details ?? {};
  return {
    name: e.input_name, domain: e.input_domain, country: e.input_country, city: e.input_city ?? null,
    supplies: d.supplies ?? null, criticality: d.criticality ?? null, annualSpendEur: d.annualSpendEur ?? null,
    leadTimeDays: d.leadTimeDays ?? null, contact: d.contact ?? null, notes: d.notes ?? null,
  };
}

/** Tier-1 supplier rows for a client (or one row by edgeId). */
export async function loadSuppliers(clientId: string, edgeId?: string, db: Queryable = pool): Promise<SupplierRow[]> {
  const r = await db.query(
    `SELECT e.*, row_to_json(c.*) AS company FROM supplier_edge e
     LEFT JOIN company c ON c.id = e.company_id
     WHERE e.client_id = $1 AND e.tier = 1 AND e.duplicate_of IS NULL AND ($2::uuid IS NULL OR e.id = $2)
     ORDER BY e.created_at, e.input_name`,
    [clientId, edgeId ?? null],
  );
  const fps = await companyFootprint(r.rows.map((x) => x.company_id).filter(Boolean), db);
  return r.rows.map((e) => ({
    edgeId: e.id,
    input: edgeInput(e),
    status: e.status,
    company: e.company ? mapCompany(e.company) : null,
    resolveScore: e.resolve_score === null ? null : Number(e.resolve_score),
    options: e.resolve_options ?? [],
    footprint: e.company_id ? fps.get(e.company_id) ?? [] : [],
    monitors: e.monitors ?? [],
    seeded: e.seeded,
    mode: e.mode,
    sourceUrls: e.source_urls ?? [],
    updatedAt: iso(e.updated_at),
  }));
}

export async function loadMergedSuppliers(clientId: string): Promise<Record<string, string>> {
  const { rows } = await pool.query<{ id: string; duplicate_of: string }>(
    "SELECT id, duplicate_of FROM supplier_edge WHERE client_id = $1 AND duplicate_of IS NOT NULL",
    [clientId],
  );
  return Object.fromEntries(rows.map((row) => [row.id, row.duplicate_of]));
}