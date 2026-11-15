import { afterAll, describe, expect, it } from "vitest";
import { MapResponse, incidentHeadline, locate, lookupCity, placeLabel, type FootprintKey, type Incident } from "@secondsource/shared";
import { config } from "../config";
import { pool } from "../db/pool";
import { runInline } from "../engine/pipeline";
import { DEMO_TRIGGER_TEXT } from "../seed/data";
import { buildMap } from "./index";
import { scoreSupplier } from "./risk";
import { buildServer } from "../server";
import { uid } from "../seed/data";

const key = (type: FootprintKey["type"], value: string, state: FootprintKey["state"] = "CONFIRMED"): FootprintKey => ({
  type, value, state, sourceUrl: null, sourceQuote: null, seeded: true,
});
const incident = (keys: FootprintKey[], severity: Incident["severity"] = "HIGH"): Incident => ({
  id: "00000000-0000-4000-8000-000000000001", eventId: "00000000-0000-4000-8000-000000000002", type: "STRIKE", severity, title: "t", quote: "q",
  sourceUrl: "http://x.test/", confirmation: "CONFIRMED", footprint: keys, unmappedNames: [], mode: "SEED", isTest: true, createdAt: new Date().toISOString(),
});
const rtm = incident([key("PORT", "NLRTM"), key("REGION", "NL-ZH", "INFERRED")]);
const deep = (name: string, keys: FootprintKey[], tier = 2) => ({ name, tier, keys });

describe("places", () => {
  it("finds cities ignoring accents and case, falls back to the country centre", () => {
    expect(lookupCity("Düsseldorf", "DE")?.name).toBe("Dusseldorf");
    expect(locate("hamburg", "DE")?.precision).toBe("CITY");
    expect(locate("Nowhereville", "FI")?.precision).toBe("COUNTRY");
    expect(locate(null, null)).toBeNull();
  });
  it("speaks plainly", () => {
    expect(placeLabel("PORT", "NLRTM")).toBe("Port of Rotterdam");
    expect(incidentHeadline("STRIKE", rtm.footprint)).toBe("Strike at Port of Rotterdam");
  });
});

describe("scoreSupplier", () => {
  it("direct exposure is high, with a plain reason", () => {
    const r = scoreSupplier([key("PORT", "NLRTM"), key("REGION", "DE-NW")], [deep("a", [key("PORT", "DEHAM")])], [rtm]);
    expect(r.level).toBe("HIGH");
    expect(r.reasons[0]).toMatch(/ships through Port of Rotterdam/);
  });
  it("an inferred direct hit counts less and says so", () => {
    const sure = scoreSupplier([key("PORT", "NLRTM")], [deep("a", [])], [rtm]).score;
    const guess = scoreSupplier([key("PORT", "NLRTM", "INFERRED")], [deep("a", [])], [rtm]);
    expect(guess.score).toBeLessThan(sure);
    expect(guess.reasons[0]).toMatch(/not confirmed/);
  });
  it("exposure only through its own suppliers is medium, not an alert-level score", () => {
    const r = scoreSupplier([key("PORT", "FIHEL")], [deep("a", [key("PORT", "NLRTM")]), deep("b", [key("PORT", "FIOUL")])], [rtm]);
    expect(r.level).toBe("MEDIUM");
    expect(r.reasons[0]).toMatch(/1 of its 2 own suppliers also depend on Port of Rotterdam/);
  });
  it("no deeper data: limited coverage, small penalty, honest sentence", () => {
    const r = scoreSupplier([key("PORT", "FIHEL")], [], []);
    expect(r.coverage).toBe("LIMITED");
    expect(r.score).toBe(20);
    expect(r.reasons.join(" ")).toMatch(/may be too low/);
  });
  it("unknown keys never match", () => {
    const r = scoreSupplier([key("PORT", "?", "UNKNOWN")], [deep("a", [key("PORT", "?", "UNKNOWN")])], [rtm]);
    expect(r.level).toBe("LOW");
  });
  it("concentration among its own suppliers adds a reason without any incident", () => {
    const r = scoreSupplier([], [deep("a", [key("PORT", "NLRTM")]), deep("b", [key("PORT", "NLRTM")])], []);
    expect(r.reasons.join(" ")).toMatch(/Most of its own suppliers \(2 of 2\) ship through Port of Rotterdam/);
  });
});

describe("GET /map data (integration)", () => {
  const eventIds: string[] = [];
  afterAll(async () => {
    const inc = (await pool.query(`SELECT id FROM incident WHERE event_id = ANY($1)`, [eventIds])).rows.map((r) => r.id);
    await pool.query(`DELETE FROM approval_audit WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
    await pool.query(`DELETE FROM check_result WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
    await pool.query(`DELETE FROM candidate WHERE incident_id = ANY($1)`, [inc]);
    await pool.query(`DELETE FROM alert WHERE incident_id = ANY($1)`, [inc]);
    await pool.query(`DELETE FROM footprint_key WHERE incident_id = ANY($1)`, [inc]);
    await pool.query(`DELETE FROM incident WHERE id = ANY($1)`, [inc]);
    await pool.query(`DELETE FROM event WHERE id = ANY($1)`, [eventIds]);
  });

  it("quiet: 10 placed direct suppliers, hub in Helsinki, only low or medium risk, deeper tiers hidden", async () => {
    const m = MapResponse.parse(await buildMap(config.DEMO_CLIENT_ID));
    expect(m.hub.city).toBe("Helsinki");
    const seeded = m.suppliers.filter((s) => s.precision === "CITY");
    expect(seeded.length).toBeGreaterThanOrEqual(10);
    expect(m.suppliers.every((s) => s.risk.level !== "HIGH")).toBe(true);
    expect(JSON.stringify(m)).not.toMatch(/Rhenish Pulp|Delta Polymers|Kymi Board/); // deeper tiers never leave the backend
    expect(m.facilities.filter((f) => f.kind === "PORT")).toHaveLength(35);
    expect(m.facilities.filter((f) => f.kind === "LOGISTICS")).toHaveLength(3);
    expect(m.movements).toHaveLength(3);
    expect(m.movements.every((route) => route.basis === "ILLUSTRATIVE")).toBe(true);
  });

  it("after the Rotterdam strike: direct suppliers high, suppliers exposed only through deeper tiers medium", async () => {
    const r = await pool.query(`INSERT INTO event (via, source_url, mode, is_test, fetched_text, t_received) VALUES ('POLL','http://localhost:3001/test-notice','LOCAL',true,$1,now()) RETURNING id`, [DEMO_TRIGGER_TEXT]);
    eventIds.push(r.rows[0].id);
    await runInline(r.rows[0].id, { publish: async () => undefined, log: () => {} });
    const m = MapResponse.parse(await buildMap(config.DEMO_CLIENT_ID));
    const by = Object.fromEntries(m.suppliers.map((s) => [s.name, s]));
    expect(by["Nordpack Packaging"]!.risk.level).toBe("HIGH");
    expect(by["Rhine Foils"]!.risk.level).toBe("HIGH");
    expect(by["Antwerp Resins"]!.risk.level).toBe("HIGH");
    expect(by["Baltic Carton"]!.risk.level).toBe("MEDIUM");
    expect(by["Baltic Carton"]!.alert).toBeNull(); // not directly hit: elevated, not alerted
    expect(by["Baltic Carton"]!.risk.reasons.join(" ")).toMatch(/own suppliers also depend on Port of Rotterdam/);
    expect(by["Gothenburg Crates"]!.risk.level).toBe("LOW");
    expect(by["Nordpack Packaging"]!.alert?.headline).toBe("Strike at Port of Rotterdam");
    const inc = m.incidents[0]!;
    expect(inc.point?.label).toBe("Port of Rotterdam");
    expect(inc.noticedInSeconds === null || inc.noticedInSeconds >= 0).toBe(true);
  });
});

describe("optional supplier details", () => {
  it("can be added later, shown on the map data, and cleared", async () => {
    const app = await buildServer();
    const edge = uid("edge", 2);
    const set = await app.inject({ method: "PUT", url: `/suppliers/${edge}/details`, payload: { supplies: "Cartons", criticality: "HIGH", annualSpendEur: 250000, leadTimeDays: 14 } });
    expect(set.statusCode).toBe(200);
    const s1 = MapResponse.parse(set.json()).suppliers.find((s) => s.name === "Baltic Carton")!;
    expect([s1.supplies, s1.criticality, s1.annualSpendEur, s1.leadTimeDays]).toEqual(["Cartons", "HIGH", 250000, 14]);
    const clear = await app.inject({ method: "PUT", url: `/suppliers/${edge}/details`, payload: { supplies: "", criticality: null, annualSpendEur: null, leadTimeDays: null } });
    const s2 = MapResponse.parse(clear.json()).suppliers.find((s) => s.name === "Baltic Carton")!;
    expect([s2.supplies, s2.criticality, s2.annualSpendEur, s2.leadTimeDays]).toEqual([null, null, null, null]);
    expect((await app.inject({ method: "PUT", url: `/suppliers/not-an-id/details`, payload: {} })).statusCode).toBe(400);
    expect((await app.inject({ method: "PUT", url: `/suppliers/00000000-0000-4000-8000-00000000dead/details`, payload: {} })).statusCode).toBe(404);
  });
});

afterAll(async () => { await pool.end(); });
