import Fastify from "fastify";
import { afterAll, describe, expect, it } from "vitest";
import { pool } from "../db/pool";
import { hashText, lineDiff, normalise, parseLastUpdated } from "./diff";
import { ingestChange } from "./ingest";
import { sign, verifySignature } from "./signature";
import { registerWebhook } from "./webhook";

const TEST_SRC = "http://localhost:3001/test-notice#ingest-test";
afterAll(async () => {
  // Leave the shared dev DB clean: remove only rows these tests created.
  const ids = (await pool.query(`SELECT id::text FROM event WHERE raw->>'contextId' LIKE 'test-%' OR source_url = $1`, [TEST_SRC])).rows.map((r) => r.id);
  await pool.query(`DELETE FROM job WHERE kind='classify_event' AND payload->>'eventId' = ANY($1)`, [ids]);
  await pool.query(`DELETE FROM event WHERE id::text = ANY($1)`, [ids]);
  await pool.end();
});

const SECRET = "whsec_test_fixture_secret";
const now = Math.floor(Date.now() / 1000);

describe("signature (self-signed fixture; UNVERIFIED against real Context.dev)", () => {
  const body = Buffer.from(JSON.stringify({ event: "change.detected", id: "x" }));
  it("accepts a good signature", () => {
    expect(verifySignature(SECRET, sign(SECRET, body, now), body).ok).toBe(true);
  });
  it("rejects a bad signature, tampered body, wrong key, missing and malformed headers", () => {
    const bad = (h: string | undefined, b = body, k = SECRET) => verifySignature(k, h, b);
    expect(bad(sign("whsec_other", body, now))).toMatchObject({ ok: false, reason: "mismatch" });
    expect(bad(sign(SECRET, body, now), Buffer.from("{}"))).toMatchObject({ ok: false, reason: "mismatch" });
    expect(bad(undefined)).toMatchObject({ ok: false, reason: "missing" });
    expect(bad("garbage")).toMatchObject({ ok: false, reason: "malformed" });
  });
  it("rejects stale timestamps (> 5 min) either direction, accepts within tolerance", () => {
    expect(verifySignature(SECRET, sign(SECRET, body, now - 330), body)).toMatchObject({ ok: false, reason: "stale" });
    expect(verifySignature(SECRET, sign(SECRET, body, now + 330), body)).toMatchObject({ ok: false, reason: "stale" });
    expect(verifySignature(SECRET, sign(SECRET, body, now - 290), body).ok).toBe(true);
  });
});

describe("diff", () => {
  it("ignores timestamp-only and whitespace changes", () => {
    const a = "Supplier and port notices (TEST)\nLast updated: 2026-01-01T00:00:00.000Z\nAll quiet.";
    const b = "Supplier and port notices (TEST)\n  Last updated: 2026-01-02T10:00:00.000Z\nAll   quiet.\n\n";
    expect(hashText(normalise(a))).toBe(hashText(normalise(b)));
  });
  it("detects a real content change and lists the lines", () => {
    const d = lineDiff(normalise("A\nAll quiet."), normalise("A\nStrike at the Port of Rotterdam."));
    expect(d).toEqual(["- All quiet.", "+ Strike at the Port of Rotterdam."]);
  });
  it("parses the page's own update time, null when absent", () => {
    expect(parseLastUpdated("x\nLast updated: 2026-11-14T10:00:00.000Z\ny")).toBe("2026-11-14T10:00:00.000Z");
    expect(parseLastUpdated("nothing")).toBeNull();
  });
});

// Integration: needs the dev database (pnpm db:up && pnpm db:migrate).
describe("POST /webhooks/contextdev", async () => {
  const app = Fastify();
  await registerWebhook(app, () => SECRET);
  await registerWebhook(Fastify(), () => "").catch(() => {});
  const uid = `test-${Date.now()}`;
  const body = JSON.stringify({
    event: "change.detected", id: uid,
    data: { change: { id: "c1", monitor_id: "mon_1", url: "http://localhost:3001/test-notice", detected_at: new Date().toISOString(), after_text_excerpt: "Strike at the Port of Rotterdam." } },
  });
  const post = (headers: Record<string, string>, payload = body) => app.inject({ method: "POST", url: "/webhooks/contextdev", payload, headers: { "content-type": "application/json", ...headers } });
  const count = async () => Number((await pool.query(`SELECT count(*) FROM event WHERE raw->>'contextId' = $1`, [uid])).rows[0].count);

  it("bad signature -> 401, no event", async () => {
    const r = await post({ "x-context-id": uid, "x-context-signature": sign("whsec_wrong", body, now) });
    expect(r.statusCode).toBe(401);
    expect(await count()).toBe(0);
  });
  it("stale signature -> 401, no event", async () => {
    const r = await post({ "x-context-id": uid, "x-context-signature": sign(SECRET, body, now - 600) });
    expect(r.statusCode).toBe(401);
    expect(r.json().reason).toBe("stale");
    expect(await count()).toBe(0);
  });
  it("good signature -> 202, event row (WEBHOOK, LIVE) + classify_event job; replay is deduped", async () => {
    const h = { "x-context-id": uid, "x-context-signature": sign(SECRET, body, Math.floor(Date.now() / 1000)) };
    const r = await post(h);
    expect(r.statusCode).toBe(202);
    const eventId = r.json().eventId as string;
    expect(eventId).toBeTruthy();
    const ev = (await pool.query(`SELECT via, mode, t_source, t_received, fetched_text FROM event WHERE id=$1`, [eventId])).rows[0];
    expect(ev).toMatchObject({ via: "WEBHOOK", mode: "LIVE", fetched_text: "Strike at the Port of Rotterdam." });
    expect(ev.t_received).toBeTruthy();
    const jobs = await pool.query(`SELECT 1 FROM job WHERE kind='classify_event' AND payload->>'eventId'=$1`, [eventId]);
    expect(jobs.rowCount).toBe(1);
    const replay = await post(h);
    expect(replay.statusCode).toBe(202);
    expect(replay.json().eventId).toBeNull();
    expect(await count()).toBe(1);
  });
  it("no secret configured -> 503", async () => {
    const a = Fastify();
    await registerWebhook(a, () => "");
    const r = await a.inject({ method: "POST", url: "/webhooks/contextdev", payload: body, headers: { "content-type": "application/json" } });
    expect(r.statusCode).toBe(503);
  });
});

describe("ingestChange", () => {
  it("writes a POLL/LOCAL event with timestamps and enqueues classify_event", async () => {
    const res = await ingestChange({
      via: "POLL", sourceUrl: TEST_SRC, mode: "LOCAL", fetchedText: "x", raw: { t: 1 }, isTest: true,
      tSource: new Date(Date.now() - 4000), tReceived: new Date(), contentHash: "h",
    });
    expect(res!.event).toMatchObject({ via: "POLL", mode: "LOCAL", status: "RECEIVED", isTest: true });
    expect(res!.event.latency.tSource).toBeTruthy();
    expect(res!.event.latency.tReceived).toBeTruthy();
  });
});
