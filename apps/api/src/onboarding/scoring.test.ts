import { describe, expect, it } from "vitest";
import { decide, rank, scoreCandidate, type Candidate } from "./scoring";
import { nameSimilarity, normalizeDomain } from "./similarity";

const cand = (over: Partial<Candidate> = {}): Candidate => ({
  name: "Nordpack Packaging GmbH", domain: "nordpack.example", country: "DE", sources: ["contextdev", "cala"], calaId: null, sourceUrls: [], mode: "SEED", ...over,
});

describe("name similarity", () => {
  it("ignores legal forms, case, accents and punctuation", () => {
    expect(nameSimilarity("Nordpack Packaging", "NORDPACK packaging GmbH")).toBe(1);
    expect(nameSimilarity("Aarhus Cultures A/S", "Aarhus Cultures")).toBe(1);
    expect(nameSimilarity("Riga Crate and Pallet", "Riga Crate & Pallet SIA")).toBe(1);
    expect(nameSimilarity("Tallinn Caps OÜ", "tallinn caps")).toBe(1);
  });
  it("is high for near names and low for unrelated ones", () => {
    expect(nameSimilarity("Helsinki Steel Cans", "Helsinki Steel Can Works")).toBeGreaterThan(0.7);
    expect(nameSimilarity("Northwind Industrial Fasteners", "Nordpack Packaging")).toBeLessThan(0.4);
  });
  it("normalises domains", () => {
    expect(normalizeDomain("https://www.Example.com/about?x=1")).toBe("example.com");
    expect(normalizeDomain("nope")).toBeNull();
    expect(normalizeDomain("  ")).toBeNull();
  });
});

describe("resolver score = 0.5 name + 0.2 country + 0.3 agreement", () => {
  const input = { name: "Nordpack Packaging", domain: null, country: "DE" };

  it("exact name, same country, two agreeing sources = 1.0", () => {
    const s = scoreCandidate(input, cand(), 2);
    expect(s).toMatchObject({ total: 1, name: 1, country: 1, agreement: 1 });
  });
  it("country mismatch costs 0.2, unknown country is neutral (0.1)", () => {
    expect(scoreCandidate({ ...input, country: "FI" }, cand(), 2).total).toBe(0.8);
    expect(scoreCandidate({ ...input, country: null }, cand(), 2).total).toBe(0.9);
  });
  it("a single source never gets full agreement (denominator at least 2)", () => {
    const s = scoreCandidate(input, cand({ sources: ["contextdev"] }), 1);
    expect(s.agreement).toBe(0.5);
    expect(s.total).toBe(0.85);
  });
  it("a user-typed domain that matches is full agreement; one that differs is zero", () => {
    expect(scoreCandidate({ ...input, domain: "nordpack.example" }, cand({ sources: ["contextdev"] }), 1).agreement).toBe(1);
    expect(scoreCandidate({ ...input, domain: "other.example" }, cand(), 2).agreement).toBe(0);
  });
});

describe("decision bands", () => {
  const input = { name: "Nordpack Packaging", domain: null, country: "DE" };

  it(">= 0.85 auto-accepts", () => {
    const d = decide(rank(input, [cand()], 2));
    expect(d.kind).toBe("ACCEPT");
  });
  it("0.6 - 0.85 is AMBIGUOUS (chooser)", () => {
    const d = decide(rank({ ...input, country: "FI" }, [cand()], 2)); // 0.8
    expect(d.kind).toBe("AMBIGUOUS");
  });
  it("< 0.6 is UNRESOLVED", () => {
    const d = decide(rank({ name: "Zebra Holdings", domain: null, country: "FI" }, [cand()], 2));
    expect(d.kind).toBe("UNRESOLVED");
  });
  it("no candidates is UNRESOLVED", () => {
    expect(decide([]).kind).toBe("UNRESOLVED");
  });
  it("a high score with a near-tied runner-up on another domain is AMBIGUOUS", () => {
    const a = cand();
    const b = cand({ name: "Nordpack Packaging Oy", domain: "nordpack.fi.example" });
    expect(decide(rank(input, [a, b], 2)).kind).toBe("AMBIGUOUS");
  });
  it("a candidate without a domain can never be auto-accepted", () => {
    expect(decide(rank(input, [cand({ domain: null })], 2)).kind).toBe("UNRESOLVED");
  });
});
