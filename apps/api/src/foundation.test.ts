import { afterAll, describe, expect, it } from "vitest";
import { FootprintKey, SupplierRow } from "@secondsource/shared";
import { config } from "./config";
import { claimJob, completeJob, enqueue, failJob } from "./db/jobs";
import { loadSuppliers } from "./db/mappers";
import { pool } from "./db/pool";
import { source } from "./source";

// Integration tests: need the dev database up and seeded (pnpm db:up && pnpm db:seed).
afterAll(() => pool.end());

describe("footprint contract", () => {
  it("requires a sourceUrl unless seeded or UNKNOWN", () => {
    const base = { type: "PORT", value: "NLRTM", sourceQuote: null } as const;
    expect(FootprintKey.safeParse({ ...base, state: "CONFIRMED", sourceUrl: null, seeded: false }).success).toBe(false);
    expect(FootprintKey.safeParse({ ...base, state: "CONFIRMED", sourceUrl: null, seeded: true }).success).toBe(true);
    expect(FootprintKey.safeParse({ type: "PORT", value: "?", state: "UNKNOWN", sourceUrl: null, sourceQuote: null, seeded: false }).success).toBe(true);
    expect(FootprintKey.safeParse({ type: "PORT", value: "NLRTM", state: "UNKNOWN", sourceUrl: null, sourceQuote: null, seeded: false }).success).toBe(false);
  });
});

describe("source() adapter", () => {
  it("runs with no keys and labels seed data SEED", async () => {
    const r = await source({ provider: "contextdev", op: "company_search", params: { query: "Nordpack" } });
    expect(r.ok).toBe(true);
    expect(r.mode).toBe("SEED");
  });
  it("never invents data: gemini has no seed", async () => {
    const r = await source({ provider: "gemini", op: "classify", params: { text: "x" } });
    expect(r.ok).toBe(false);
    expect(r.data).toBeNull();
  });
});

describe("db", () => {
  it("seeded suppliers satisfy the SupplierRow contract", async () => {
    const rows = await loadSuppliers(config.DEMO_CLIENT_ID);
    expect(rows.length).toBe(10);
    for (const r of rows) SupplierRow.parse(r);
    expect(rows.every((r) => r.seeded && r.mode === "SEED")).toBe(true);
  });

  it("job queue claims once, retries with backoff, then completes", async () => {
    await pool.query("DELETE FROM job");
    const id = await enqueue("poll_page", { url: "https://example.com", label: null });
    const [a, b] = await Promise.all([claimJob(), claimJob()]);
    expect([a, b].filter(Boolean).length).toBe(1); // SKIP LOCKED: only one worker gets it
    const job = (a ?? b)!;
    expect(job.id).toBe(id);
    await failJob(job, new Error("boom"));
    expect(await claimJob()).toBeNull(); // backing off
    await pool.query("UPDATE job SET run_after = now() WHERE id = $1", [id]);
    const again = (await claimJob())!;
    expect(again.attempts).toBe(2);
    await completeJob(again.id);
    await pool.query("DELETE FROM job");
  });
});
