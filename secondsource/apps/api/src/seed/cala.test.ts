import { afterAll, describe, expect, it } from "vitest";
import { FootprintKey, MapResponse } from "@secondsource/shared";
import { pool } from "../db/pool";
import { runInline } from "../engine/pipeline";
import { buildMap } from "../map";
import { buildServer } from "../server";
import { packsAvailable, REAL_CLIENT_ID } from "./cala";

const eventIds: string[] = [];
const edgeIds: string[] = [];

afterAll(async () => {
  const inc = (await pool.query(`SELECT id FROM incident WHERE event_id = ANY($1)`, [eventIds])).rows.map((r) => r.id);
  await pool.query(`DELETE FROM approval_audit WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
  await pool.query(`DELETE FROM check_result WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
  await pool.query(`DELETE FROM candidate WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM alert WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM footprint_key WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM incident WHERE id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM event WHERE id = ANY($1)`, [eventIds]);
  await pool.query(`DELETE FROM supplier_edge WHERE id = ANY($1)`, [edgeIds]);
  await pool.end();
});

describe.skipIf(!packsAvailable())("real-data scenario (public Cala packs)", () => {
  it("imports ports, sites and a hidden supplier graph", async () => {
    const ports = (await pool.query(`SELECT id FROM port`)).rows.map((r) => r.id);
    expect(ports.length).toBeGreaterThanOrEqual(40);
    expect(ports).toContain("TW-KAOHSIUNG");
    const direct = (await pool.query(`SELECT count(*)::int n FROM supplier_edge WHERE client_id = $1 AND tier = 1`, [REAL_CLIENT_ID])).rows[0].n;
    const hidden = (await pool.query(`SELECT count(*)::int n FROM supplier_edge WHERE client_id = $1 AND tier >= 2`, [REAL_CLIENT_ID])).rows[0].n;
    expect(direct).toBe(12);
    expect(hidden).toBeGreaterThanOrEqual(40);
    expect((await pool.query(`SELECT count(*)::int n FROM site`)).rows[0].n).toBe(607);
  });

  it("keeps the pack anonymous: aliases only, no domains, no per-company source URLs on headquarters", async () => {
    const names = (await pool.query(`SELECT name, domain, source_urls FROM company WHERE mode = 'REC'`)).rows;
    expect(names.length).toBeGreaterThan(700);
    expect(names.every((r) => /^(Supplier|Company|Buyer)-/.test(r.name) && r.domain === null)).toBe(true);
    expect(names.filter((r) => r.name.startsWith("Company-")).every((r) => r.source_urls.length === 0)).toBe(true);
  });

  it("every imported footprint key satisfies the contract; assumed ports are labelled as assumptions, never confirmed", async () => {
    const rows = (await pool.query(`SELECT k.* FROM footprint_key k JOIN company c ON c.id = k.company_id WHERE c.mode = 'REC'`)).rows;
    expect(rows.length).toBeGreaterThan(1000);
    for (const r of rows) {
      FootprintKey.parse({ type: r.type, value: r.value, state: r.state, sourceUrl: r.source_url, sourceQuote: r.source_quote, seeded: r.seeded });
    }
    const ports = rows.filter((r) => r.type === "PORT" && r.state !== "UNKNOWN");
    expect(ports.length).toBeGreaterThan(50);
    expect(ports.every((r) => r.state === "INFERRED" && r.seeded && /Scenario assumption/.test(r.source_quote))).toBe(true);
    expect(rows.filter((r) => r.type === "PLANT").every((r) => r.state === "CONFIRMED" && !!r.source_url)).toBe(true);
  });

  it("the map shows the 12 direct suppliers only; the 48 suppliers behind Supplier-0131 stay hidden but are counted", async () => {
    const m = MapResponse.parse(await buildMap(REAL_CLIENT_ID));
    expect(m.scenario).toBe("cala");
    expect(m.suppliers).toHaveLength(12);
    expect(m.suppliers.every((s) => s.lat !== null && s.anonymised && s.sites.length > 0)).toBe(true);
    const hubSupplier = m.suppliers.find((s) => s.name === "Supplier-0131")!;
    expect(hubSupplier.risk.deeperChecked).toBe(48);
    expect(JSON.stringify(m)).not.toMatch(/Supplier-0002\b/); // a hidden tier-2 alias is never returned
    expect(m.demo.noticeText).toMatch(/Strike action at the Port of /);
    expect(m.ports.length).toBeGreaterThanOrEqual(5);
    // suppliers known only by country are spread so they do not stack on one point
    const points = new Set(m.suppliers.map((s) => `${s.lat?.toFixed(2)},${s.lng?.toFixed(2)}`));
    expect(points.size).toBe(12);
  });

  it("the demo disruption reaches real suppliers through their assumed port, shows on the map and offers (unverified) alternatives", async () => {
    const notice = (await pool.query(`SELECT demo_notice FROM client WHERE id = $1`, [REAL_CLIENT_ID])).rows[0].demo_notice as string;
    const ev = await pool.query(`INSERT INTO event (via, source_url, mode, is_test, fetched_text, t_received) VALUES ('POLL','http://localhost:3001/test-notice','LOCAL',true,$1,now()) RETURNING id`, [notice]);
    eventIds.push(ev.rows[0].id);
    const r = await runInline(ev.rows[0].id, { publish: async () => undefined, log: () => {} });
    expect(r.outcome).toBe("incident");
    const m = MapResponse.parse(await buildMap(REAL_CLIENT_ID));
    const inc = m.incidents[0]!;
    expect(inc.point).not.toBeNull();
    expect(inc.affected.length).toBeGreaterThanOrEqual(1);
    const hit = m.suppliers.filter((s) => s.alert);
    expect(hit.length).toBe(inc.affected.length);
    expect(hit.every((s) => s.risk.level === "HIGH" && s.risk.reasons[0]!.includes("not confirmed"))).toBe(true); // assumed port => "we think so"
    const cands = (await pool.query(`SELECT verdict FROM candidate WHERE incident_id = $1 AND for_edge_id = (SELECT edge_id FROM alert WHERE incident_id = $1 LIMIT 1)`, [(await pool.query(`SELECT id FROM incident WHERE event_id = $1`, [ev.rows[0].id])).rows[0].id])).rows;
    expect(cands.length).toBeGreaterThan(0);
    expect(cands.length).toBeLessThanOrEqual(12);
    expect(cands.every((c) => c.verdict !== "VERIFIED")).toBe(true); // ownership is anonymised, so nothing can be fully verified
  });

  it("a new supplier can snap to a known company; duplicates are refused", async () => {
    const app = await buildServer();
    const found = (await app.inject({ url: "/known?country=DE" })).json().companies as Array<{ companyId: string; name: string }>;
    expect(found.length).toBeGreaterThan(0);
    const first = found[0]!;
    const added = await app.inject({ method: "POST", url: "/suppliers/snap", payload: { companyId: first.companyId, supplies: "Test parts", criticality: "HIGH" } });
    expect(added.statusCode).toBe(201);
    edgeIds.push(added.json().edgeId);
    const mine = MapResponse.parse(added.json().map).suppliers.find((s) => s.edgeId === added.json().edgeId)!;
    expect([mine.name, mine.supplies, mine.criticality, mine.status]).toEqual([first.name, "Test parts", "HIGH", "MONITORED"]);
    expect((await app.inject({ method: "POST", url: "/suppliers/snap", payload: { companyId: first.companyId } })).statusCode).toBe(409);
    expect((await app.inject({ url: "/known?country=DE" })).json().companies.some((c: { companyId: string }) => c.companyId === first.companyId)).toBe(false);
    expect((await app.inject({ method: "POST", url: "/suppliers/snap", payload: { companyId: "00000000-0000-4000-8000-00000000dead" } })).statusCode).toBe(404);
  });
});
