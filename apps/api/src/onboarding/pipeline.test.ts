import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SupplierRow, SseEnvelope, type SupplierStatus } from "@secondsource/shared";
import { config } from "../config";
import { completeJob } from "../db/jobs";
import { listenClient, pool } from "../db/pool";
import { buildServer } from "../server";
import { CATALOG, DEMO_PASTE_LIST } from "./demoCatalog";
import mod from "./index";
import { withUnknownPlaceholders } from "./pipeline";

/**
 * Integration test: the paste flow through the real HTTP routes, with the job queue drained in-process
 * (no separate worker). Needs the dev database up. No keys, no external calls: all SEED.
 * Run this file on its own or with --no-file-parallelism: other test files reset the shared job table.
 */
type App = Awaited<ReturnType<typeof buildServer>>;
let app: App;
const sse: Array<{ edgeId: string; status: SupplierStatus; mode: string | null; note: string | null }> = [];

const KINDS = ["resolve_supplier", "extract_footprint"] as const;

/** Run queued onboarding jobs until none are left (handlers can enqueue more). */
async function drain() {
  for (let i = 0; i < 200; i++) {
    const r = await pool.query(
      `UPDATE job SET status = 'running', attempts = attempts + 1
       WHERE id = (SELECT id FROM job WHERE status = 'queued' AND kind = ANY($1) ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
       RETURNING id, kind, payload`,
      [KINDS],
    );
    const job = r.rows[0];
    if (!job) return;
    await (mod.jobHandlers as any)[job.kind](job.payload);
    await completeJob(job.id);
  }
  throw new Error("drain did not settle");
}

async function cleanup() {
  const domains = CATALOG.map((c) => c.domain);
  await pool.query(`DELETE FROM job WHERE kind = ANY($1)`, [KINDS]);
  await pool.query(`DELETE FROM supplier_edge WHERE client_id = $1 AND tier = 1 AND input_name = ANY($2)`, [
    config.DEMO_CLIENT_ID, [...DEMO_PASTE_LIST.map((d) => d.name), "Keyless Test Co"],
  ]);
  await pool.query(`DELETE FROM supplier_edge WHERE client_id = $1 AND seeded AND company_id IN (SELECT id FROM company WHERE domain = ANY($2))`, [config.DEMO_CLIENT_ID, domains]);
  await pool.query(`DELETE FROM company WHERE domain = ANY($1) OR domain = 'keylesstest.example'`, [domains]);
}

let listener: Awaited<ReturnType<typeof listenClient>>;
beforeAll(async () => {
  app = await buildServer();
  await cleanup();
  listener = await listenClient();
  listener.on("notification", (m) => {
    if (m.channel !== "sse" || !m.payload) return;
    const e = SseEnvelope.parse(JSON.parse(m.payload));
    if (e.type === "supplier.status") sse.push(e.data);
  });
  await listener.query("LISTEN sse");
});
afterAll(async () => {
  await cleanup();
  await listener.end();
  await app.close();
  await pool.end();
});

const getRows = async () => (await app.inject({ method: "GET", url: "/suppliers" })).json().suppliers as SupplierRow[];
const byName = (rows: SupplierRow[], name: string) => rows.find((r) => r.input.name === name)!;

describe("paste flow over the API (SEED, keyless)", () => {
  let ids: Record<string, string> = {};

  it("POST /suppliers/resolve creates PENDING rows and returns 202", async () => {
    const res = await app.inject({ method: "POST", url: "/suppliers/resolve", payload: { suppliers: DEMO_PASTE_LIST } });
    expect(res.statusCode).toBe(202);
    const rows = res.json().suppliers as SupplierRow[];
    expect(rows).toHaveLength(10);
    for (const r of rows) {
      SupplierRow.parse(r);
      expect(r.status).toBe("PENDING");
      ids[r.input.name] = r.edgeId;
    }
  });

  it("rejects bad input", async () => {
    expect((await app.inject({ method: "POST", url: "/suppliers/resolve", payload: { suppliers: [] } })).statusCode).toBe(400);
    expect((await app.inject({ method: "POST", url: "/suppliers/resolve", payload: { nope: 1 } })).statusCode).toBe(400);
    expect((await app.inject({ method: "POST", url: "/suppliers/not-a-uuid/choose", payload: { domain: "a.example" } })).statusCode).toBe(400);
  });

  it("resolves the list: 8 monitored, 1 ambiguous (chooser), 1 unresolved (needs a domain)", async () => {
    await drain();
    const rows = await getRows();
    const mine = DEMO_PASTE_LIST.map((d) => byName(rows, d.name));
    const tally = (s: SupplierStatus) => mine.filter((r) => r.status === s).length;
    expect(tally("MONITORED")).toBe(8);
    expect(tally("AMBIGUOUS")).toBe(1);
    expect(tally("UNRESOLVED")).toBe(1);

    const amb = byName(rows, "Helsinki Steel Cans");
    expect(amb.status).toBe("AMBIGUOUS");
    expect(amb.options.length).toBeGreaterThanOrEqual(2);
    expect(amb.options.map((o) => o.domain)).toEqual(expect.arrayContaining(["helsinkisteelcans.example", "hsc-works.example"]));
    expect(amb.resolveScore).toBeGreaterThanOrEqual(0.6);
    expect(amb.resolveScore).toBeLessThan(0.85);
    expect(amb.company).toBeNull();
    // Regression (chooser "This one" was disabled on a fresh DB): options for companies not stored yet have
    // companyId null, so EVERY option must carry a domain the client can choose by.
    expect(amb.options.every((o) => !!o.companyId || !!o.domain)).toBe(true);

    const unres = byName(rows, "Northwind Industrial Fasteners");
    expect(unres.status).toBe("UNRESOLVED");
    expect(unres.company).toBeNull();
    expect(unres.resolveScore ?? 0).toBeLessThan(0.6);
  });

  it("monitored rows have sources, a POLL registration, mode SEED and the SEEDED flag", async () => {
    const rows = await getRows();
    for (const r of rows.filter((x) => x.status === "MONITORED" && x.input.name in ids)) {
      SupplierRow.parse(r);
      expect(r.mode).toBe("SEED");
      expect(r.seeded).toBe(true);
      expect(r.sourceUrls.length).toBeGreaterThan(0);
      expect(r.company?.seeded).toBe(true);
      expect(r.monitors).toEqual([{ url: `${config.PUBLIC_BASE_URL}/test-notice`, kind: "POLL" }]);
      expect(r.resolveScore).toBeGreaterThanOrEqual(0.85);
    }
  });

  it("stores footprints: all five types, source URLs on real keys, SEEDED labels, UNKNOWN placeholders", async () => {
    const rows = await getRows();
    for (const r of rows.filter((x) => x.status === "MONITORED" && x.input.name in ids)) {
      expect(new Set(r.footprint.map((k) => k.type))).toEqual(new Set(["REGION", "PORT", "PLANT", "PARENT", "SANCTION"]));
      for (const k of r.footprint) {
        expect(k.seeded || k.state === "UNKNOWN").toBe(true);
        if (k.state === "UNKNOWN") expect(k.value).toBe("?");
        else expect(k.sourceUrl).toMatch(/^https:\/\/[a-z0-9.-]+\.example\//);
      }
    }
    const rhine = byName(rows, "Rhine Valley Closures GmbH");
    expect(rhine.footprint.find((k) => k.type === "PORT" && k.value === "NLRTM")?.state).toBe("INFERRED");
    const porvoo = byName(rows, "Porvoo Label Works");
    expect(porvoo.footprint.find((k) => k.type === "PARENT")).toMatchObject({ value: "?", state: "UNKNOWN", sourceUrl: null });
    const oulu = byName(rows, "Oulu Barrier Films");
    expect(oulu.input.domain).toBe("oulubarrier.example");
  });

  it("emitted supplier.status for every row: PENDING, then RESOLVED, then MONITORED", async () => {
    await new Promise((r) => setTimeout(r, 300)); // let the last NOTIFYs arrive
    const seq = (name: string) => sse.filter((e) => e.edgeId === ids[name]).map((e) => e.status);
    expect(seq("Savonia Dairy Cartons")).toEqual(["PENDING", "RESOLVED", "MONITORED"]);
    expect(seq("Gdansk Pallet Systems")).toEqual(["PENDING", "RESOLVED", "MONITORED"]);
    expect(seq("Helsinki Steel Cans")).toEqual(["PENDING", "AMBIGUOUS"]);
    expect(seq("Northwind Industrial Fasteners")).toEqual(["PENDING", "UNRESOLVED"]);
    expect(sse.find((e) => e.status === "MONITORED")?.note).toMatch(/poll/);
  });

  it("Exa is the fallback for a company Context.dev does not know (Gdansk): still resolves", async () => {
    const g = byName(await getRows(), "Gdansk Pallet Systems");
    expect(g.status).toBe("MONITORED");
    expect(g.company?.domain).toBe("gdanskpallets.example");
  });

  it("chooser: picking an option by domain resolves the AMBIGUOUS row to MONITORED", async () => {
    const res = await app.inject({ method: "POST", url: `/suppliers/${ids["Helsinki Steel Cans"]}/choose`, payload: { domain: "helsinkisteelcans.example" } });
    expect(res.statusCode).toBe(200);
    expect(res.json().supplier.status).toBe("RESOLVED");
    await drain();
    const row = byName(await getRows(), "Helsinki Steel Cans");
    expect(row.status).toBe("MONITORED");
    expect(row.company?.name).toBe("Helsinki Steel Cans Oy");
    expect(row.options).toEqual([]);
    expect(row.footprint.some((k) => k.type === "PORT" && k.value === "FIHEL")).toBe(true);
  });

  it("needs-a-domain: supplying one resolves the UNRESOLVED row", async () => {
    const res = await app.inject({ method: "POST", url: `/suppliers/${ids["Northwind Industrial Fasteners"]}/choose`, payload: { domain: "https://www.KalevaTrade.example/about" } });
    expect(res.statusCode).toBe(200);
    await drain();
    const row = byName(await getRows(), "Northwind Industrial Fasteners");
    expect(row.status).toBe("MONITORED");
    expect(row.company?.domain).toBe("kalevatrade.example");
  });

  it("choose on a row that is not waiting is 409; empty body is 400", async () => {
    expect((await app.inject({ method: "POST", url: `/suppliers/${ids["Savonia Dairy Cartons"]}/choose`, payload: { domain: "x.example" } })).statusCode).toBe(409);
    expect((await app.inject({ method: "POST", url: `/suppliers/${ids["Savonia Dairy Cartons"]}/choose`, payload: {} })).statusCode).toBe(409);
    expect((await app.inject({ method: "POST", url: `/suppliers/00000000-0000-4000-8000-0000000000aa/choose`, payload: { domain: "x.example" } })).statusCode).toBe(404);
  });

  it("an unknown domain typed by the user is recorded as user-typed (INFERRED region, seeded), never CONFIRMED", async () => {
    const res = await app.inject({ method: "POST", url: "/suppliers/resolve", payload: { suppliers: [{ name: "Keyless Test Co", domain: null, country: "SE" }] } });
    const id = res.json().suppliers[0].edgeId as string;
    await drain();
    expect(byName(await getRows(), "Keyless Test Co").status).toBe("UNRESOLVED");
    await app.inject({ method: "POST", url: `/suppliers/${id}/choose`, payload: { domain: "keylesstest.example" } });
    await drain();
    const row = byName(await getRows(), "Keyless Test Co");
    expect(row.status).toBe("MONITORED");
    expect(row.footprint.find((k) => k.type === "REGION")).toMatchObject({ value: "SE", state: "INFERRED", seeded: true, sourceUrl: null });
    expect(row.footprint.every((k) => k.state !== "CONFIRMED")).toBe(true);
  });
});

describe("footprint placeholders", () => {
  it("pads every missing type with one UNKNOWN '?' key and keeps real keys", () => {
    const keys = withUnknownPlaceholders([{ type: "REGION", value: "FI", state: "INFERRED", sourceUrl: null, seeded: true, mode: "SEED" }], "SEED");
    expect(keys.filter((k) => k.state === "UNKNOWN").map((k) => k.type).sort()).toEqual(["PARENT", "PLANT", "PORT", "SANCTION"]);
    expect(keys.find((k) => k.type === "REGION")?.value).toBe("FI");
  });
});
