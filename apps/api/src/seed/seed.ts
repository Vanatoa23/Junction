import { config } from "../config";
import { pool, tx } from "../db/pool";
import { migrate } from "../db/migrate";
import { DEFAULT_NOTICE_TEXT, DEMO_CLIENT_NAME, SEED_COMPANIES, SEED_UPSTREAM, uid } from "./data";

/**
 * Idempotent: safe to run on every `pnpm dev`. Re-running restores seeded rows
 * (companies, footprints, the demo client's seeded supplier edges) but never
 * touches rows created by real flows (live resolutions, events, alerts...).
 */
export async function seed(log = console.log) {
  await tx(async (c) => {
    await c.query(`INSERT INTO client (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, [config.DEMO_CLIENT_ID, DEMO_CLIENT_NAME]);

    const all = [
      ...SEED_COMPANIES.map((s) => ({ ...s, upstreamOf: null as number | null })),
      ...SEED_UPSTREAM.map((u) => ({ ...u, supplier: false, pool: false, category: "upstream", upstreamOf: u.buyerN })),
    ];
    for (const s of all) {
      const id = uid("company", s.n);
      await c.query(
        `INSERT INTO company (id, name, legal_name, domain, country, category, in_candidate_pool, seeded, mode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,'SEED')
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, legal_name=EXCLUDED.legal_name, domain=EXCLUDED.domain,
           country=EXCLUDED.country, category=EXCLUDED.category, in_candidate_pool=EXCLUDED.in_candidate_pool, updated_at=now()`,
        [id, s.name, s.legalName, s.domain, s.country, s.category, !!s.pool],
      );
      await c.query(`DELETE FROM footprint_key WHERE company_id = $1 AND seeded`, [id]);
      for (const [type, value, state = "CONFIRMED"] of s.keys) {
        await c.query(
          `INSERT INTO footprint_key (company_id, type, value, state, source_url, seeded, mode)
           VALUES ($1,$2,$3,$4,NULL,true,'SEED') ON CONFLICT DO NOTHING`,
          [id, type, value, state],
        );
      }
    }

    // Demo client's seeded edges (tier 1 and tier 2). Status RESOLVED: nothing is MONITORED until Ingest really arms a monitor/poll.
    await c.query(`DELETE FROM supplier_edge WHERE client_id = $1 AND seeded`, [config.DEMO_CLIENT_ID]);
    for (const s of SEED_COMPANIES.filter((x) => x.supplier)) {
      await c.query(
        `INSERT INTO supplier_edge (id, client_id, company_id, tier, input_name, input_domain, input_country, status, resolve_score, seeded, mode)
         VALUES ($1,$2,$3,1,$4,$5,$6,'RESOLVED',1.000,true,'SEED')`,
        [uid("edge", s.n), config.DEMO_CLIENT_ID, uid("company", s.n), s.name, s.domain, s.country],
      );
    }
    for (const u of SEED_UPSTREAM) {
      await c.query(
        `INSERT INTO supplier_edge (id, client_id, buyer_company_id, company_id, tier, input_name, input_domain, input_country, status, resolve_score, seeded, mode)
         VALUES ($1,$2,$3,$4,2,$5,$6,$7,'RESOLVED',1.000,true,'SEED')`,
        [uid("edge", u.n), config.DEMO_CLIENT_ID, uid("company", u.buyerN), uid("company", u.n), u.name, u.domain, u.country],
      );
    }

    await c.query(`INSERT INTO test_notice (id, text) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`, [DEFAULT_NOTICE_TEXT]);
  });
  log(`seeded demo client, ${SEED_COMPANIES.length + SEED_UPSTREAM.length} companies`);
}

const isMain = process.argv[1]?.endsWith("seed.ts");
if (isMain) {
  migrate()
    .then(() => seed())
    .then(() => pool.end())
    .catch((e) => { console.error(e); process.exit(1); });
}
