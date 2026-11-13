import { afterAll, describe, expect, it } from "vitest";
import { Alert, Candidate } from "@secondsource/shared";
import { buildServer } from "../server";
import { config } from "../config";
import { pool } from "../db/pool";
import { DEMO_TRIGGER_TEXT, uid } from "../seed/data";
import { loadAlerts, loadCandidates } from "./mappers";
import { runInline } from "./pipeline";

/**
 * Integration tests: need the dev database up and seeded. They call the handlers INLINE (no worker, no SSE
 * dependency) and delete every row they create.
 */
const eventIds: string[] = [];
const noPublish = { publish: async () => undefined, log: () => {} };

async function newEvent(text: string): Promise<string> {
  const r = await pool.query(
    `INSERT INTO event (via, source_url, mode, is_test, fetched_text, t_received) VALUES ('POLL','http://localhost:3001/test-notice','LOCAL',true,$1,now()) RETURNING id`,
    [text],
  );
  eventIds.push(r.rows[0].id);
  return r.rows[0].id;
}

const dupEdges: string[] = [];

afterAll(async () => {
  const inc = (await pool.query(`SELECT id FROM incident WHERE event_id = ANY($1)`, [eventIds])).rows.map((r) => r.id);
  await pool.query(`DELETE FROM approval_audit WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
  await pool.query(`DELETE FROM check_result WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id = ANY($1))`, [inc]);
  await pool.query(`DELETE FROM candidate WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM alert WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM footprint_key WHERE incident_id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM incident WHERE id = ANY($1)`, [inc]);
  await pool.query(`DELETE FROM event WHERE id = ANY($1)`, [eventIds]);
  await pool.query(`DELETE FROM supplier_edge WHERE id = ANY($1)`, [dupEdges]);
  await pool.end();
});

describe("seeded demo end to end (inline pipeline)", async () => {
  const eventId = await newEvent(DEMO_TRIGGER_TEXT);
  const outcome = await runInline(eventId, noPublish);
  const incidentId = outcome.outcome === "incident" ? outcome.incidentId : "";
  const nordpackEdge = uid("edge", 1);
  const app = await buildServer();

  it("creates an incident with a verified quote and footprint", async () => {
    expect(outcome.outcome).toBe("incident");
    const inc = (await pool.query(`SELECT * FROM incident WHERE id = $1`, [incidentId])).rows[0];
    expect(inc.type).toBe("STRIKE");
    expect(inc.quote_verified).toBe(true);
    expect(DEMO_TRIGGER_TEXT).toContain(inc.quote);
    const keys = (await pool.query(`SELECT type, value FROM footprint_key WHERE incident_id = $1`, [incidentId])).rows.map((r) => `${r.type}:${r.value}`);
    expect(keys).toEqual(expect.arrayContaining(["PORT:NLRTM", "REGION:NL-ZH"]));
    const ev = (await pool.query(`SELECT status, t_classified FROM event WHERE id = $1`, [eventId])).rows[0];
    expect(ev.status).toBe("INCIDENT");
    expect(ev.t_classified).not.toBeNull();
  });

  it("alerts exactly the three Rotterdam-exposed suppliers with quote and latency", async () => {
    const alerts = (await loadAlerts(config.DEMO_CLIENT_ID, { incidentId })).map((a) => Alert.parse(a));
    expect(alerts.map((a) => a.supplierName).sort()).toEqual(["Antwerp Resins", "Nordpack Packaging", "Rhine Foils"]);
    for (const a of alerts) {
      expect(a.quote).toContain("Strike action");
      expect(a.latency.tReceived && a.latency.tClassified && a.latency.tAlert).toBeTruthy();
      expect(a.mode).toBe("SEED"); // LOCAL fetch + SEED classifier: never LIVE
      expect(a.isTest).toBe(true);
    }
    expect(alerts.find((a) => a.supplierName === "Antwerp Resins")!.matchedKeys.some((m) => m.supplier.state === "INFERRED")).toBe(true);
  });

  it("alternatives: verified, unverified (C5), failed (C2), ranked", async () => {
    const cands = (await loadCandidates(config.DEMO_CLIENT_ID, { incidentId, edgeId: nordpackEdge })).map((c) => Candidate.parse(c));
    const by = Object.fromEntries(cands.map((c) => [c.company.name, c]));
    expect(by["Karlstad Pack"]!.verdict).toBe("VERIFIED");
    expect(by["Tampere Board"]!.verdict).toBe("UNVERIFIED");
    expect(by["Tampere Board"]!.checks.find((c) => c.check === "C5")!.status).toBe("UNKNOWN");
    expect(by["Maasvlakte Wrap"]!.verdict).toBe("FAILED");
    expect(by["Maasvlakte Wrap"]!.checks.find((c) => c.check === "C2")!.status).toBe("FAIL");
    expect(by["Lodz Pack"]!.checks.find((c) => c.check === "C5")!.status).toBe("FAIL");
    expect(cands.map((c) => c.verdict)).toEqual(["VERIFIED", "UNVERIFIED", "FAILED", "FAILED"]); // never UNVERIFIED above VERIFIED
    expect(by["Karlstad Pack"]!.checks.find((c) => c.check === "LIVE_NEWS")!.reason).toMatch(/not run/);
  });

  it("GET routes return the contract shapes", async () => {
    const detail = await app.inject({ url: `/incidents/${incidentId}` });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().alerts).toHaveLength(3);
    expect(detail.json().event.latency.tAlert).not.toBeNull();
    const alt = await app.inject({ url: `/incidents/${incidentId}/alternatives?edgeId=${nordpackEdge}` });
    expect(alt.json().ready).toBe(true);
    expect(alt.json().candidates).toHaveLength(4);
    const top3 = await app.inject({ url: `/incidents/${incidentId}/alternatives?edgeId=${nordpackEdge}&limit=3` });
    expect(top3.json().candidates).toHaveLength(3);
  });

  it("approve: only a fully passing candidate; others rejected; one audit row", async () => {
    const cands = await loadCandidates(config.DEMO_CLIENT_ID, { incidentId, edgeId: nordpackEdge });
    const id = (n: string) => cands.find((c) => c.company.name === n)!.id;
    for (const n of ["Tampere Board", "Maasvlakte Wrap", "Lodz Pack"]) {
      const r = await app.inject({ method: "POST", url: `/candidates/${id(n)}/approve`, payload: {} });
      expect(r.statusCode, n).toBe(409);
      expect(r.json().error).toBe("not_verified");
    }
    expect((await pool.query(`SELECT count(*)::int AS n FROM approval_audit WHERE candidate_id = ANY($1)`, [cands.map((c) => c.id)])).rows[0].n).toBe(0);

    const ok = await app.inject({ method: "POST", url: `/candidates/${id("Karlstad Pack")}/approve`, payload: { actor: "tester", note: "ok" } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().candidate.status).toBe("APPROVED");
    expect(ok.json().audit.decision).toBe("APPROVE");
    const audit = (await pool.query(`SELECT * FROM approval_audit WHERE candidate_id = $1`, [id("Karlstad Pack")])).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0].snapshot.verdict).toBe("VERIFIED");
    expect(audit[0].snapshot.checks.length).toBe(6);

    const again = await app.inject({ method: "POST", url: `/candidates/${id("Karlstad Pack")}/approve`, payload: {} });
    expect(again.statusCode).toBe(409);
    expect((await app.inject({ method: "POST", url: `/candidates/00000000-0000-4000-8000-00000000dead/approve`, payload: {} })).statusCode).toBe(404);
  });

  it("a tampered verdict column cannot be approved (recomputed from stored checks)", async () => {
    const cands = await loadCandidates(config.DEMO_CLIENT_ID, { incidentId, edgeId: nordpackEdge });
    const tampa = cands.find((c) => c.company.name === "Maasvlakte Wrap")!;
    await pool.query(`UPDATE candidate SET verdict = 'VERIFIED' WHERE id = $1`, [tampa.id]);
    const r = await app.inject({ method: "POST", url: `/candidates/${tampa.id}/approve`, payload: {} });
    expect(r.statusCode).toBe(409);
  });
});

describe("drop and block paths", () => {
  it("drops an event whose quote is not in the fetched text, and logs a reason", async () => {
    const text = "Port of Rotterdam update. Nothing unusual.";
    const id = await newEvent(text);
    const fake = {
      ...noPublish,
      classify: async () => ({
        ok: true, mode: "LIVE" as const, provider: "gemini" as const, op: "classify", note: null, sourceUrls: [], latencyMs: 1, fetchedAt: new Date().toISOString(), recordedAt: null,
        data: { incident: true, classifier: "fake", type: "STRIKE", severity: "HIGH", title: "x", quote: "Dockworkers walked out at Rotterdam", keys: [], unmappedNames: [] },
      }),
    };
    const r = await runInline(id, fake);
    expect(r.outcome).toBe("dropped");
    const ev = (await pool.query(`SELECT status, drop_reason, t_classified FROM event WHERE id = $1`, [id])).rows[0];
    expect(ev.status).toBe("DROPPED");
    expect(ev.drop_reason).toMatch(/quote not found/);
    expect((await pool.query(`SELECT 1 FROM incident WHERE event_id = $1`, [id])).rows).toHaveLength(0);
  });

  it("a non-incident notice is CLASSIFIED, no incident", async () => {
    const id = await newEvent("Supplier and port notices. No active disruptions are listed.");
    expect((await runInline(id, noPublish)).outcome).toBe("not_incident");
    expect((await pool.query(`SELECT status FROM event WHERE id = $1`, [id])).rows[0].status).toBe("CLASSIFIED");
  });

  it("unresolvable names block the auto-alert and surface for human mapping; mapping unblocks it", async () => {
    const id = await newEvent("Strike at the Port of Zeebrugge. Terminals closed until further notice.");
    const r = await runInline(id, noPublish);
    if (r.outcome !== "incident") throw new Error("expected incident");
    expect((await loadAlerts(config.DEMO_CLIENT_ID, { incidentId: r.incidentId })).length).toBe(0);
    const app = await buildServer();
    const list = await app.inject({ url: "/incidents" });
    expect(list.json().incidents.find((i: any) => i.id === r.incidentId).unmappedNames).toEqual(["Port of Zeebrugge"]);
    const mapped = await app.inject({ method: "POST", url: `/incidents/${r.incidentId}/mapping`, payload: { keys: [{ type: "PORT", value: "BEZEE" }] } });
    expect(mapped.statusCode).toBe(202);
    expect(mapped.json().incident.unmappedNames).toEqual([]);
    expect(mapped.json().incident.footprint.some((k: any) => k.value === "BEZEE" && k.seeded)).toBe(true);
    // the queued match_incident job is for the worker; clear it so no stray job is left behind
    await pool.query(`DELETE FROM job WHERE kind = 'match_incident' AND payload->>'incidentId' = $1`, [r.incidentId]);
  });
});

describe("duplicate supplier edges", () => {
  it("alerts once per (client, company) even if the same supplier was pasted twice", async () => {
    const dup = await pool.query(
      `INSERT INTO supplier_edge (client_id, tier, company_id, input_name, status, mode) VALUES ($1, 1, $2, 'Nordpack dup', 'MONITORED', 'SEED') RETURNING id`,
      [config.DEMO_CLIENT_ID, "10000000-0000-4000-8000-000000000001"],
    );
    dupEdges.push(dup.rows[0].id);
    const id = await newEvent("NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). Terminals closed.");
    const r = await runInline(id, noPublish);
    if (r.outcome !== "incident") throw new Error("expected incident");
    const alerts = await loadAlerts(config.DEMO_CLIENT_ID, { incidentId: r.incidentId });
    expect(alerts.filter((a) => a.supplierName === "Nordpack Packaging")).toHaveLength(1);
  });
});
