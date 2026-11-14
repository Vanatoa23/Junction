import { config } from "../config";
import { pool, tx } from "../db/pool";
import { migrate } from "../db/migrate";
import { locate } from "@secondsource/shared";
import { DEFAULT_NOTICE_TEXT, DEMO_CLIENT_NAME, SEED_COMPANIES, SEED_DEEP, SEED_UPSTREAM, uid } from "./data";

/**
 * Idempotent: safe to run on every `pnpm dev`. Re-running restores seeded rows
 * (companies, footprints, the demo client's seeded supplier edges) but never
 * touches rows created by real flows (live resolutions, events, alerts...).
 */
export async function seed(log = console.log) {
  await tx(async (c) => {
    const hub = locate("Helsinki", "FI")!;
    await c.query(
      `INSERT INTO client (id, name, city, country, lat, lng) VALUES ($1, $2, 'Helsinki', 'FI', $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, country = EXCLUDED.country, lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
      [config.DEMO_CLIENT_ID, DEMO_CLIENT_NAME, hub.lat, hub.lng],
    );

    const all = [
      ...SEED_COMPANIES.map((s) => ({ ...s, upstreamOf: null as number | null })),
      ...SEED_UPSTREAM.map((u) => ({ ...u, supplier: false, pool: false, category: "upstream", upstreamOf: u.buyerN })),
      ...SEED_DEEP.map((u) => ({ ...u, supplier: false, pool: false, category: "upstream", upstreamOf: u.buyerN })),
    ];
    for (const s of all) {
      const id = uid("company", s.n);
      const place = locate((s as { city?: string }).city, s.country);
      await c.query(
        `INSERT INTO company (id, name, legal_name, domain, country, category, in_candidate_pool, seeded, mode, city, lat, lng)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,'SEED',$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, legal_name=EXCLUDED.legal_name, domain=EXCLUDED.domain,
           country=EXCLUDED.country, category=EXCLUDED.category, in_candidate_pool=EXCLUDED.in_candidate_pool,
           city=EXCLUDED.city, lat=EXCLUDED.lat, lng=EXCLUDED.lng, updated_at=now()`,
        [id, s.name, s.legalName, s.domain, s.country, s.category, !!s.pool, place?.city ?? null, place?.lat ?? null, place?.lng ?? null],
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

    // Demo client's seeded edges (tier 1 and tier 2). Tier 1 are MONITORED with the notice-page poll listed (the demo's real watch); deeper tiers stay RESOLVED.
    await c.query(`DELETE FROM supplier_edge WHERE client_id = $1 AND seeded`, [config.DEMO_CLIENT_ID]);
    for (const s of SEED_COMPANIES.filter((x) => x.supplier)) {
      await c.query(
        `INSERT INTO supplier_edge (id, client_id, company_id, tier, input_name, input_domain, input_country, input_city, status, monitors, resolve_score, seeded, mode)
         VALUES ($1,$2,$3,1,$4,$5,$6,$7,'MONITORED',$8,1.000,true,'SEED')`,
        // "Watching" = the notice page poll (the same watch the pasted suppliers get); matching covers every supplier footprint.
        [uid("edge", s.n), config.DEMO_CLIENT_ID, uid("company", s.n), s.name, s.domain, s.country, s.city ?? null, JSON.stringify([{ url: `${config.PUBLIC_BASE_URL}/test-notice`, kind: "POLL" }])],
      );
    }
    for (const u of [...SEED_UPSTREAM, ...SEED_DEEP]) {
      await c.query(
        `INSERT INTO supplier_edge (id, client_id, buyer_company_id, company_id, tier, input_name, input_domain, input_country, status, resolve_score, seeded, mode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'RESOLVED',1.000,true,'SEED')`,
        [uid("edge", u.n), config.DEMO_CLIENT_ID, uid("company", u.buyerN), uid("company", u.n), (u as { tier?: number }).tier ?? 2, u.name, u.domain, u.country],
      );
    }

    await c.query(`INSERT INTO test_notice (id, text) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`, [DEFAULT_NOTICE_TEXT]);
  });
  log(`seeded demo client, ${SEED_COMPANIES.length + SEED_UPSTREAM.length + SEED_DEEP.length} companies`);
}

const isMain = process.argv[1]?.endsWith("seed.ts");
if (isMain) {
  migrate()
    .then(() => seed())
    .then(() => pool.end())
    .catch((e) => { console.error(e); process.exit(1); });
}
