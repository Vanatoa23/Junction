import { describe, expect, it } from "vitest";
import type { FootprintKey } from "@secondsource/shared";
import { c1Region, c2Port, c3UpstreamPlant, c4Sanction, c5Parent, rankCandidates, runAllChecks, verdictOf, type CheckInput } from "./index";

const key = (type: FootprintKey["type"], value: string, extra: Partial<FootprintKey> = {}): FootprintKey => ({
  type, value, state: "CONFIRMED", sourceUrl: null, sourceQuote: null, seeded: true, ...extra,
});
const unknown = (type: FootprintKey["type"]): FootprintKey => key(type, "?", { state: "UNKNOWN" });
const input = (p: Partial<CheckInput> = {}): CheckInput => ({ incident: [], candidate: [], candidateUpstream: [], affectedSupplier: [], ...p });
const url = "https://example.test/notice";

describe("C1 region (nested)", () => {
  it("FAILS when the incident region covers the candidate region (FI covers FI-UUS)", () => {
    const r = c1Region(input({ incident: [key("REGION", "FI", { sourceUrl: url })], candidate: [key("REGION", "FI-UUS")] }));
    expect(r.status).toBe("FAIL");
    expect(r.evidence.map((e) => e.url)).toContain(url);
  });
  it("FAILS when the candidate region covers the incident region", () => {
    expect(c1Region(input({ incident: [key("REGION", "NL-ZH")], candidate: [key("REGION", "NL")] })).status).toBe("FAIL");
  });
  it("PASSES disjoint regions", () => {
    expect(c1Region(input({ incident: [key("REGION", "NL-ZH")], candidate: [key("REGION", "SE-S")] })).status).toBe("PASS");
  });
  it("is UNKNOWN (never PASS) with no or placeholder candidate region", () => {
    expect(c1Region(input({ incident: [key("REGION", "NL-ZH")] })).status).toBe("UNKNOWN");
    expect(c1Region(input({ incident: [key("REGION", "NL-ZH")], candidate: [unknown("REGION")] })).status).toBe("UNKNOWN");
  });
  it("a FAIL outranks UNKNOWN: overlap in known data fails even with a placeholder", () => {
    expect(c1Region(input({ incident: [key("REGION", "NL-ZH")], candidate: [unknown("REGION"), key("REGION", "NL-ZH")] })).status).toBe("FAIL");
  });
});

describe("C2 port", () => {
  it("FAILS on a shared port, case-insensitively", () => {
    expect(c2Port(input({ incident: [key("PORT", "NLRTM")], candidate: [key("PORT", "nlrtm")] })).status).toBe("FAIL");
  });
  it("PASSES different ports, UNKNOWN without port data", () => {
    expect(c2Port(input({ incident: [key("PORT", "NLRTM")], candidate: [key("PORT", "SEGOT")] })).status).toBe("PASS");
    expect(c2Port(input({ incident: [key("PORT", "NLRTM")], candidate: [unknown("PORT")] })).status).toBe("UNKNOWN");
  });
  it("inferred candidate ports still count as overlap", () => {
    expect(c2Port(input({ incident: [key("PORT", "NLRTM")], candidate: [key("PORT", "NLRTM", { state: "INFERRED" })] })).status).toBe("FAIL");
  });
});

describe("C3 upstream plant", () => {
  it("FAILS when a tier-2 plant equals an incident plant", () => {
    expect(c3UpstreamPlant(input({ incident: [key("PLANT", "p1")], candidateUpstream: [key("PLANT", "p1")] })).status).toBe("FAIL");
  });
  it("FAILS when a tier-2 supplier sits in the incident region", () => {
    expect(c3UpstreamPlant(input({ incident: [key("REGION", "NL-ZH")], candidateUpstream: [key("REGION", "NL-ZH")] })).status).toBe("FAIL");
  });
  it("PASSES with known, disjoint upstream; UNKNOWN with none", () => {
    expect(c3UpstreamPlant(input({ incident: [key("PORT", "NLRTM"), key("REGION", "NL-ZH")], candidateUpstream: [key("REGION", "SE-S"), key("PLANT", "x")] })).status).toBe("PASS");
    expect(c3UpstreamPlant(input({ incident: [key("PORT", "NLRTM")] })).status).toBe("UNKNOWN");
    expect(c3UpstreamPlant(input({ incident: [key("PORT", "NLRTM")], candidateUpstream: [unknown("PLANT")] })).status).toBe("UNKNOWN");
  });
});

describe("C4 sanction", () => {
  it("PASSES when the incident is not a sanctions incident", () => {
    expect(c4Sanction(input({ incident: [key("PORT", "NLRTM")] })).status).toBe("PASS");
  });
  it("FAILS when the candidate parent is on the programme", () => {
    const r = c4Sanction(input({ incident: [key("SANCTION", "EU-RU")], candidateParent: [key("SANCTION", "EU-RU")] }));
    expect(r.status).toBe("FAIL");
  });
  it("is UNKNOWN for a sanctions incident when we have no screening data", () => {
    expect(c4Sanction(input({ incident: [key("SANCTION", "EU-RU")], candidate: [key("REGION", "SE-S")] })).status).toBe("UNKNOWN");
  });
  it("PASSES when screening data exists and does not match", () => {
    expect(c4Sanction(input({ incident: [key("SANCTION", "EU-RU")], candidate: [key("SANCTION", "EU-BY")] })).status).toBe("PASS");
  });
});

describe("C5 parent", () => {
  it("FAILS on a shared parent with the affected supplier", () => {
    expect(c5Parent(input({ candidate: [key("PARENT", "seed:h")], affectedSupplier: [key("PARENT", "seed:h")] })).status).toBe("FAIL");
  });
  it("PASSES with distinct known parents", () => {
    expect(c5Parent(input({ candidate: [key("PARENT", "a")], affectedSupplier: [key("PARENT", "b")] })).status).toBe("PASS");
  });
  it("is UNKNOWN when the candidate parent is unknown", () => {
    expect(c5Parent(input({ candidate: [unknown("PARENT")], affectedSupplier: [key("PARENT", "b")] })).status).toBe("UNKNOWN");
  });
  it("is UNKNOWN when the affected supplier parent is unknown", () => {
    expect(c5Parent(input({ candidate: [key("PARENT", "a")], affectedSupplier: [unknown("PARENT")] })).status).toBe("UNKNOWN");
  });
});

describe("verdict and ranking", () => {
  it("any FAIL excludes, any UNKNOWN is unverified, all PASS is verified", () => {
    expect(verdictOf([{ status: "PASS" }, { status: "FAIL" }, { status: "UNKNOWN" }])).toBe("FAILED");
    expect(verdictOf([{ status: "PASS" }, { status: "UNKNOWN" }])).toBe("UNVERIFIED");
    expect(verdictOf([{ status: "PASS" }])).toBe("VERIFIED");
  });
  it("UNVERIFIED never ranks above VERIFIED", () => {
    const p = { status: "PASS" as const };
    const u = { status: "UNKNOWN" as const };
    const ranked = rankCandidates([
      { name: "A", verdict: "UNVERIFIED" as const, results: [u] },
      { name: "Z", verdict: "VERIFIED" as const, results: [p] },
      { name: "B", verdict: "FAILED" as const, results: [{ status: "FAIL" as const }] },
    ]);
    expect(ranked.map((r) => r.name)).toEqual(["Z", "A", "B"]);
  });
  it("runAllChecks returns C1..C5 in order", () => {
    expect(runAllChecks(input()).map((r) => r.check)).toEqual(["C1", "C2", "C3", "C4", "C5"]);
  });
});
