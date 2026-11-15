import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { locate } from "@secondsource/shared";
import { config } from "../config";
import { migrate } from "../db/migrate";
import { pool, tx } from "../db/pool";

/**
 * REAL-DATA SCENARIO ("cala"): loads the committed public Cala packs. Keyless and offline.
 *
 *  - data/packs/cala/world_v0 (this repo, vendored from the Crucible repo): 841 cited observations from eight public
 *    disclosures. 218 supplier-to-buyer links, 607 site records (country level), 16 freight routes. Names are ALIASES
 *    (Supplier-0001, Buyer-0001, Site-0008). A separate, source-linked overlay supplies display names.
 *  - ../data/packs/cala/starting_grid_v0 (repo root): real ports with coordinates, and headquarters nodes (alias, city,
 *    country). We import ports and headquarters; display names come from the overlay, while aliases remain graph keys.
 *
 * What becomes of it:
 *  - a second demo client "Real-data demo" (the anonymised buyer's supply base, hub placed in Helsinki as an assumption);
 *  - direct suppliers = the best-documented suppliers of Buyer-0001; each supplier's OWN suppliers (the pack's
 *    supplier-to-supplier links) become the hidden tier 2/3 that feeds its risk;
 *  - sites = real facility records (country level) shown on the supplier card and map;
 *  - ports = real ports with coordinates; a supplier's port is an ASSUMPTION (the pack says so: the carrier sources
 *    establish service availability, not which supplier ships where). It is stored INFERRED + SEEDED with the
 *    assumption written in source_quote, never as a confirmed fact.
 *
 * Everything imported is mode REC (a recorded real dataset), never LIVE. The fictional seed is untouched.
 */
export const REAL_CLIENT_ID = "00000000-0000-4000-8000-000000000002";
const BUYER = "Buyer-0001";
const DIRECT_COUNT = 10;

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
export const worldDir = () => process.env.CALA_WORLD_DIR ?? join(root, "data/packs/cala/world_v0");
export const gridDir = () => process.env.CALA_GRID_DIR ?? join(root, "../data/packs/cala/starting_grid_v0");
export const namesFile = () => process.env.CALA_NAMES_FILE ?? join(root, "data/packs/cala/names_v1.json");

const uuid = (ns: string, key: string) => {
  const h = createHash("sha1").update(`${ns}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
const read = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;
const hashPick = <T,>(items: T[], key: string): T => items[parseInt(createHash("sha1").update(key).digest("hex").slice(0, 8), 16) % items.length]!;

interface Fact { id: string; kind: "supplier" | "site" | "route"; subject_alias: string; attributes: Record<string, any>; source_ids: string[] }
interface GridNode { id: string; alias: string; node_type: string; city: string | null; country: string | null; lat: number | null; lon: number | null; industry: string | null; source_ids: string[] }
interface NameEntry { name: string; source_url: string }

const noticeFor = (portName: string) =>
  `NOTICE: Strike action at the Port of ${portName}. All container terminals are closed until further notice. Inbound and outbound cargo is delayed.`;

export function packsAvailable(): boolean {
  return existsSync(join(worldDir(), "world_facts.json")) && existsSync(namesFile());
}

export async function seedCala(log: (m: string) => void = console.log) {
  if (!packsAvailable()) {
    log(`world pack or name overlay missing (${worldDir()}, ${namesFile()}): real-data scenario skipped`);
    return { skipped: true as const };
  }
  const facts = read<Fact[]>(join(worldDir(), "world_facts.json"));
  const names = read<Record<string, NameEntry>>(namesFile());
  const display = (alias: string) => {
    const name = names[alias]?.name;
    if (!name) throw new Error(`no verified display name for ${alias} in ${namesFile()}`);
    return name;
  };
  const worldSources = new Map(read<Array<{ id: string; url: string }>>(join(worldDir(), "sources.json")).map((s) => [s.id, s.url]));
  const urlOf = (ids: string[]) => ids.map((i) => worldSources.get(i)).find(Boolean) ?? null;

  // ---------------------------------------------------------------- the supply graph from the pack
  const supplies = new Map<string, string[]>(); // supplier alias -> aliases it supplies (buyers or other suppliers)
  const supplierSources = new Map<string, Set<string>>();
  const sitesOf = new Map<string, Array<{ alias: string; country: string; city: string | null; url: string | null }>>();
  for (const f of facts) {
    if (f.kind === "supplier") {
      supplies.set(f.subject_alias, [...(supplies.get(f.subject_alias) ?? []), ...(f.attributes.supplies ?? [])]);
      supplierSources.set(f.subject_alias, new Set([...(supplierSources.get(f.subject_alias) ?? []), ...f.source_ids]));
    } else if (f.kind === "site" && f.attributes.operator) {
      const op = f.attributes.operator as string;
      sitesOf.set(op, [...(sitesOf.get(op) ?? []), { alias: f.subject_alias, country: String(f.attributes.country).toUpperCase(), city: f.attributes.city ?? null, url: urlOf(f.source_ids) }]);
    }
  }
  const aliases = new Set<string>([...supplies.keys(), ...sitesOf.keys(), ...[...supplies.values()].flat().filter((a) => a.startsWith("Supplier-"))]);
  const mainCountry = (a: string) => {
    const c = new Map<string, number>();
    for (const s of sitesOf.get(a) ?? []) c.set(s.country, (c.get(s.country) ?? 0) + 1);
    return [...c.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0]?.[0] ?? null;
  };

  // direct suppliers: the best-documented suppliers of the buyer (most countries, then most sites), plus the two that have
  // their own suppliers in the pack, so the hidden layers have something to show
  const ofBuyer = [...supplies.entries()].filter(([, t]) => t.includes(BUYER)).map(([a]) => a);
  const withOwn = new Set<string>();
  for (const [x, targets] of supplies) for (const t of targets) if (t.startsWith("Supplier-") && x !== t) withOwn.add(t);
  const score = (a: string) => new Set((sitesOf.get(a) ?? []).map((s) => s.country)).size * 1000 + (sitesOf.get(a) ?? []).length;
  const ranked = ofBuyer.filter((a) => (sitesOf.get(a) ?? []).length > 0).sort((a, b) => score(b) - score(a) || a.localeCompare(b));
  const placeable = (a: string) => (sitesOf.get(a) ?? []).length > 0;
  const direct = [...new Set([...[...withOwn].filter((a) => aliases.has(a) && placeable(a)), ...ranked])].slice(0, DIRECT_COUNT + 2);

  // ---------------------------------------------------------------- ports and headquarters from the starting grid
  const ports: Array<{ id: string; name: string; country: string; lat: number; lng: number; url: string | null }> = [];
  const hqs: GridNode[] = [];
  if (existsSync(join(gridDir(), "grid_nodes.json"))) {
    const nodes = read<GridNode[]>(join(gridDir(), "grid_nodes.json"));
    for (const n of nodes) {
      if (n.node_type === "port" && n.lat != null && n.lon != null && n.country) ports.push({ id: `${n.country}-${slug(n.alias)}`, name: n.alias, country: n.country, lat: n.lat, lng: n.lon, url: null });
      else if (n.node_type === "hq" && n.country) hqs.push(n);
    }
  } else {
    log(`starting grid not found at ${gridDir()}: no real ports or headquarters imported`);
  }
  const portsByCountry = new Map<string, typeof ports>();
  for (const p of ports) portsByCountry.set(p.country, [...(portsByCountry.get(p.country) ?? []), p].sort((a, b) => a.id.localeCompare(b.id)));

  // ---------------------------------------------------------------- write
  const stats: Record<string, any> = { ports: 0, companies: 0, hqs: 0, sites: 0, keys: 0, direct: 0, tier2: 0, tier3: 0 };
  await tx(async (c) => {
    for (const p of ports) {
      await c.query(
        `INSERT INTO port (id, name, country, lat, lng, source_urls, mode) VALUES ($1,$2,$3,$4,$5,$6,'REC')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
        [p.id, p.name, p.country, p.lat, p.lng, p.url ? [p.url] : []],
      );
      stats.ports++;
    }

    // Headquarters nodes: use verified display names, retaining aliases only as stable pack keys.
    for (const h of hqs) {
      await c.query(
        `INSERT INTO company (id, name, legal_name, country, category, city, lat, lng, in_candidate_pool, seeded, mode, source_urls)
         VALUES ($1,$2,$2,$3,$4,$5,$6,$7,false,false,'REC','{}')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, legal_name = EXCLUDED.legal_name, country = EXCLUDED.country, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng, updated_at = now()`,
        [uuid("grid", h.id), display(h.alias), h.country, h.industry, h.city, h.lat, h.lon],
      );
      stats.hqs++;
    }

    // client
    const hub = locate("Helsinki", "FI")!;
    await c.query(
      `INSERT INTO client (id, name, city, country, lat, lng, scenario, demo_notice, demo_label)
       VALUES ($1,'Real-data demo (anonymised buyer)','Helsinki','FI',$2,$3,'cala',$4,$5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, country = EXCLUDED.country, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
         scenario = 'cala', demo_notice = EXCLUDED.demo_notice, demo_label = EXCLUDED.demo_label`,
      [REAL_CLIENT_ID, hub.lat, hub.lng, noticeFor("Kaohsiung"), "Strike at the Port of Kaohsiung"], // refined below once the assumed ports are known
    );

    // companies, sites and footprint keys
    const directSet = new Set(direct);
    const assumedPort = new Map<string, { id: string; name: string }>();
    const ids: string[] = [];
    for (const a of aliases) {
      const id = uuid("company", a);
      ids.push(id);
      const urls = [...new Set([...(supplierSources.get(a) ?? [])].map((s) => worldSources.get(s)).filter((u): u is string => !!u))];
      await c.query(
        `INSERT INTO company (id, name, legal_name, country, category, in_candidate_pool, seeded, mode, source_urls)
         VALUES ($1,$2,$2,$3,'electronics',$4,false,'REC',$5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, legal_name = EXCLUDED.legal_name, country = EXCLUDED.country, category = 'electronics', in_candidate_pool = EXCLUDED.in_candidate_pool, source_urls = EXCLUDED.source_urls, updated_at = now()`,
        [id, display(a), mainCountry(a), !directSet.has(a), urls],
      );
      stats.companies++;
    }
    await c.query(`DELETE FROM footprint_key WHERE company_id = ANY($1)`, [ids]);
    await c.query(`DELETE FROM site WHERE company_id = ANY($1)`, [ids]);
    for (const a of aliases) {
      const id = uuid("company", a);
      const sites = sitesOf.get(a) ?? [];
      const byCountry = new Map<string, typeof sites>();
      for (const s of sites) byCountry.set(s.country, [...(byCountry.get(s.country) ?? []), s]);
      const key = async (type: string, value: string, state: string, url: string | null, quote: string | null, seeded: boolean) => {
        await c.query(
          `INSERT INTO footprint_key (company_id, type, value, state, source_url, source_quote, seeded, mode) VALUES ($1,$2,$3,$4,$5,$6,$7,'REC') ON CONFLICT DO NOTHING`,
          [id, type, value, state, url, quote, seeded],
        );
        stats.keys++;
      };
      for (const [country, list] of byCountry) {
        await key("REGION", country, "CONFIRMED", list[0]!.url, `${list.length} site${list.length > 1 ? "s" : ""} disclosed in ${country}`, false);
        const pt = locate(null, country);
        for (const s of list) {
          await c.query(`INSERT INTO site (id, company_id, country, city, lat, lng, source_url, mode) VALUES ($1,$2,$3,$4,NULL,NULL,$5,'REC') ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id`, [s.alias, id, country, s.city, s.url]);
          await key("PLANT", s.alias, "CONFIRMED", s.url, "facility disclosed in a public supplier list", false);
          stats.sites++;
        }
        void pt;
      }
      // port: an ASSUMPTION about where this supplier ships from (the pack does not say). Labelled as such.
      const mc = mainCountry(a);
      const candidates = mc ? portsByCountry.get(mc) : undefined;
      if (candidates?.length) {
        const p = hashPick(candidates, `${a}:${mc}`);
        assumedPort.set(a, p);
        await key("PORT", p.id, "INFERRED", null, `Scenario assumption: assumed to ship via the Port of ${p.name}. The source does not say which port this supplier uses.`, true);
      } else {
        await key("PORT", "?", "UNKNOWN", null, null, false);
      }
      await key("PARENT", "?", "UNKNOWN", null, null, false); // naming a supplier does not establish ownership
    }

    // supplier edges for the real-data client: direct (tier 1) and their own suppliers (tier 2, 3), hidden from the map
    // edge ids are deterministic, so a re-run keeps existing edges (and the alerts and candidates that point at them)
    await c.query(
      `DELETE FROM supplier_edge e WHERE e.client_id = $1 AND e.details->>'_pack' = 'true'
         AND NOT EXISTS (SELECT 1 FROM alert a WHERE a.edge_id = e.id) AND NOT EXISTS (SELECT 1 FROM candidate k WHERE k.for_edge_id = e.id)`,
      [REAL_CLIENT_ID],
    );
    const monitors = JSON.stringify([{ url: `${config.PUBLIC_BASE_URL}/test-notice`, kind: "POLL" }]);
    const insertEdge = async (alias: string, tier: number, buyerAlias: string | null) => {
      await c.query(
        `INSERT INTO supplier_edge (id, client_id, buyer_company_id, company_id, tier, input_name, input_country, status, monitors, resolve_score, seeded, mode, details)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1.000,false,'REC','{"_pack":"true"}')
         ON CONFLICT (id) DO UPDATE SET input_name = EXCLUDED.input_name`,
        [uuid(`edge${tier}`, `${buyerAlias ?? "-"}>${alias}`), REAL_CLIENT_ID, buyerAlias ? uuid("company", buyerAlias) : null, uuid("company", alias), tier, display(alias), mainCountry(alias), tier === 1 ? "MONITORED" : "RESOLVED", tier === 1 ? monitors : "[]"],
      );
    };
    for (const a of direct) { await insertEdge(a, 1, null); stats.direct++; }
    // the "Test a disruption" notice targets the port the most direct suppliers are assumed to use, so the demo has real impact
    const tally = new Map<string, { name: string; n: number }>();
    for (const a of direct) {
      const p = assumedPort.get(a);
      if (p) tally.set(p.id, { name: p.name, n: (tally.get(p.id)?.n ?? 0) + 1 });
    }
    const top = [...tally.entries()].sort((x, y) => y[1].n - x[1].n || x[0].localeCompare(y[0]))[0];
    if (top) {
      await c.query(`UPDATE client SET demo_notice = $2, demo_label = $3 WHERE id = $1`, [REAL_CLIENT_ID, noticeFor(top[1].name), `Strike at the Port of ${top[1].name}`]);
      stats.demoPort = `${top[1].name} (${top[1].n} direct suppliers)`;
    }
    let frontier = direct;
    for (const tier of [2, 3]) {
      const next: string[] = [];
      for (const [x, targets] of supplies) for (const t of targets) {
        if (!frontier.includes(t) || x === t) continue;
        await insertEdge(x, tier, t);
        next.push(x);
        if (tier === 2) stats.tier2++; else stats.tier3++;
      }
      frontier = next;
    }
  });
  log(`cala pack: ${stats.ports} ports, ${stats.hqs} headquarters, ${stats.companies} supplier companies, ${stats.sites} sites, ${stats.keys} footprint keys; ` +
      `client "Real-data demo": ${stats.direct} direct suppliers, ${stats.tier2} tier-2 and ${stats.tier3} tier-3 links (hidden). Demo notice port: ${stats.demoPort ?? "none"}. Direct: ${direct.join(", ")}`);
  return { skipped: false as const, ...stats, direct };
}

if (process.argv[1]?.endsWith("cala.ts")) {
  migrate()
    .then(() => seedCala())
    .then(() => pool.end())
    .catch((e) => { console.error(e); process.exit(1); });
}
