import { describe, expect, it } from "vitest";
import { ClassifyOutput } from "@secondsource/shared";
import { verifyQuote } from "../lib/quote";
import { DEFAULT_NOTICE_TEXT, DEMO_TRIGGER_TEXT } from "./data";
import { classifyRuleBased } from "./classifier";

describe("rule-based classifier", () => {
  it("baseline notice is not an incident", () => {
    expect(classifyRuleBased(DEFAULT_NOTICE_TEXT).incident).toBe(false);
  });
  it("demo trigger yields STRIKE at NLRTM/NL-ZH with a verifiable quote", () => {
    const r = ClassifyOutput.parse(classifyRuleBased(DEMO_TRIGGER_TEXT));
    if (!r.incident) throw new Error("expected incident");
    expect(r.type).toBe("STRIKE");
    expect(r.severity).toBe("HIGH");
    expect(r.keys.map((k) => `${k.type}:${k.value}`)).toEqual(expect.arrayContaining(["PORT:NLRTM", "REGION:NL-ZH"]));
    expect(verifyQuote(DEMO_TRIGGER_TEXT, r.quote)).toBe(true);
    expect(r.unmappedNames).toEqual([]);
  });
  it("unknown port is reported as unmapped", () => {
    const r = classifyRuleBased("Strike at the Port of Zeebrugge. Terminals closed.");
    if (!r.incident) throw new Error("expected incident");
    expect(r.unmappedNames).toEqual(["Port of Zeebrugge"]);
  });
});
