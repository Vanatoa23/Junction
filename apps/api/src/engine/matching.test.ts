import { describe, expect, it } from "vitest";
import type { FootprintKey } from "@secondsource/shared";
import { matchKeys } from "./matching";

const k = (type: FootprintKey["type"], value: string, state: FootprintKey["state"] = "CONFIRMED"): FootprintKey => ({
  type, value, state, sourceUrl: null, sourceQuote: null, seeded: true,
});

describe("matchKeys", () => {
  it("nested regions match both ways (FI covers FI-UUS)", () => {
    expect(matchKeys([k("REGION", "FI")], [k("REGION", "FI-UUS")])).toHaveLength(1);
    expect(matchKeys([k("REGION", "FI-UUS")], [k("REGION", "FI")])).toHaveLength(1);
  });
  it("sibling regions do not match", () => {
    expect(matchKeys([k("REGION", "FI-UUS")], [k("REGION", "FI-PIR")])).toHaveLength(0);
  });
  it("ports match exactly and only against ports", () => {
    expect(matchKeys([k("PORT", "NLRTM")], [k("PORT", "nlrtm"), k("REGION", "NLRTM")])).toHaveLength(1);
    expect(matchKeys([k("PORT", "NLRTM")], [k("PORT", "BEANR")])).toHaveLength(0);
  });
  it("INFERRED supplier keys still match", () => {
    expect(matchKeys([k("PORT", "NLRTM")], [k("PORT", "NLRTM", "INFERRED")])).toHaveLength(1);
  });
  it("UNKNOWN placeholders never match", () => {
    expect(matchKeys([k("PORT", "?", "UNKNOWN")], [k("PORT", "?", "UNKNOWN")])).toHaveLength(0);
  });
});
