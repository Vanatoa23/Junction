import { describe, expect, it } from "vitest";
import { regionCovers, regionsOverlap } from "./regions";

describe("regions", () => {
  it("parent covers child but not the reverse", () => {
    expect(regionCovers("FI", "FI-UUS")).toBe(true);
    expect(regionCovers("FI-UUS", "FI")).toBe(false);
  });
  it("does not match on string prefix alone", () => {
    expect(regionCovers("FI", "FIN-X")).toBe(false);
    expect(regionsOverlap("SE-O", "FI-UUS")).toBe(false);
  });
  it("overlap is symmetric", () => {
    expect(regionsOverlap("FI-UUS", "FI")).toBe(true);
  });
});
