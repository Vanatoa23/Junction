import { runAllChecks, rankCandidates, verdictOf, type Verdict } from "@secondsource/checks";
import type { CheckResult, FootprintKey } from "@secondsource/shared";
import { companyFootprint } from "../db/mappers";
import { pool, tx } from "../db/pool";
import { defaultDeps, type EngineDeps } from "./deps";
import { liveNewsCheck } from "./liveNews";
import { leastLive, loadIncidents } from "./mappers";

/**
 * Job find_alternatives {incidentId, edgeId}.
 * Candidates = the seeded pool (company.in_candidate_pool) in the affected supplier's category, excluding the
 * supplier itself. (Exa discovery of NEW companies would need onboarding them first: not in the MVP.)
 * For each candidate: C1..C5 (packages/checks, pure) + LIVE_NEWS (stretch, SEED => "not run").
 * Verdict from C1..C5; a LIVE_NEWS FAIL also excludes. Candidates are ranked VERIFIED > UNVERIFIED > FAILED
 * (see rankCandidates) and ALL are stored; the API returns them ranked (optionally ?limit=).
 */
export async function findAlternatives(
  p: { incidentId: string; edgeId: string }, deps: EngineDeps = defaultDeps,
): Promise<{ candidateIds: string[] }> {
  const [incident] = await loadIncidents({ id: p.incidentId });
  if (!incident) throw new Error(`incident ${p.incidentId} not found`);
  const edge = (await pool.query(`SELECT se.client_id, se.company_id, c.category FROM supplier_edge se LEFT JOIN company c ON c.id = se.company_id WHERE se.id = $1`, [p.edgeId])).rows[0];
  if (!edge?.company_id) throw new Error(`supplier edge ${p.edgeId} not found or unresolved`);
  const clientId: string = edge.client_id;

  const pool_ = (
    await pool.query(
      `SELECT * FROM company WHERE in_candidate_pool AND id <> $1 AND ($2::text IS NULL OR category = $2) ORDER BY name`,
      [edge.company_id, edge.category],
    )
  ).rows;

  const ids = [edge.company_id, ...pool_.map((c) => c.id)];
  const upstreamEdges = (
    await pool.query(
      `SELECT buyer_company_id, company_id FROM supplier_edge WHERE client_id = $1 AND tier = 2 AND buyer_company_id = ANY($2) AND company_id IS NOT NULL`,
      [clientId, pool_.map((c) => c.id)],
    )
  ).rows;
  const fps = await companyFootprint([...ids, ...upstreamEdges.map((u) => u.company_id), ...pool_.map((c) => c.parent_company_id).filter(Boolean)]);

  // url -> stored mode, used to rewrite the provisional evidence mode from the checks package
  const urlModes = new Map<string, any>(
    (await pool.query(
      `SELECT source_url, mode FROM footprint_key WHERE source_url IS NOT NULL AND (company_id = ANY($1) OR incident_id = $2)`,
      [[...ids, ...upstreamEdges.map((u) => u.company_id)], p.incidentId],
    )).rows.map((r) => [r.source_url, r.mode]),
  );
  const fixModes = (r: CheckResult): CheckResult => ({ ...r, evidence: r.evidence.map((e) => ({ ...e, mode: urlModes.get(e.url) ?? "SEED" })) });

  const evaluated = [];
  for (const c of pool_) {
    const upstream: FootprintKey[] = upstreamEdges.filter((u) => u.buyer_company_id === c.id).flatMap((u) => fps.get(u.company_id) ?? []);
    const results = runAllChecks({
      incident: incident.footprint,
      candidate: fps.get(c.id) ?? [],
      candidateUpstream: upstream,
      affectedSupplier: fps.get(edge.company_id) ?? [],
      candidateParent: c.parent_company_id ? fps.get(c.parent_company_id) : undefined,
    }).map(fixModes);
    const news = await liveNewsCheck({ name: c.name, domain: c.domain }, incident.type);
    let verdict: Verdict = verdictOf(results);
    if (news.result.status === "FAIL") verdict = "FAILED";
    evaluated.push({ company: c, name: c.name as string, verdict, results: [...results, news.result], mode: leastLive([c.mode, news.mode]) });
  }
  const ranked = rankCandidates(evaluated);

  const candidateIds = await tx(async (cx) => {
    const out: string[] = [];
    for (const [idx, e] of ranked.entries()) {
      const row = await cx.query(
        `INSERT INTO candidate (client_id, incident_id, for_edge_id, company_id, verdict, rank, mode, seeded)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (client_id, incident_id, for_edge_id, company_id)
         DO UPDATE SET verdict = EXCLUDED.verdict, rank = EXCLUDED.rank, mode = EXCLUDED.mode, seeded = EXCLUDED.seeded
         RETURNING id`,
        [clientId, p.incidentId, p.edgeId, e.company.id, e.verdict, idx + 1, e.mode, e.company.seeded],
      );
      const id = row.rows[0].id as string;
      out.push(id);
      for (const r of e.results) {
        await cx.query(
          `INSERT INTO check_result (client_id, candidate_id, check_id, status, reason, evidence) VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (candidate_id, check_id) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason, evidence = EXCLUDED.evidence`,
          [clientId, id, r.check, r.status, r.reason, JSON.stringify(r.evidence)],
        );
      }
    }
    return out;
  });

  try {
    await deps.publish({ type: "alternatives.ready", data: { incidentId: p.incidentId, edgeId: p.edgeId, candidateIds } });
  } catch (err) {
    deps.log(`alternatives.ready publish failed: ${(err as Error).message}`);
  }
  deps.log(`incident ${p.incidentId} edge ${p.edgeId}: ${candidateIds.length} candidate(s) -> ${ranked.map((r) => `${r.name}=${r.verdict}`).join(", ") || "none in pool"}`);
  return { candidateIds };
}
