import { describe, expect, it } from "vitest";
import { verifyQuote } from "./quote";

describe("verifyQuote", () => {
  const text = "NOTICE: Strike action at the Port of Rotterdam.\n  All terminals   are closed.";
  it("accepts verbatim text, ignoring whitespace differences", () => {
    expect(verifyQuote(text, "All terminals are closed.")).toBe(true);
  });
  it("rejects paraphrases, case changes and empty quotes", () => {
    expect(verifyQuote(text, "All terminals are shut.")).toBe(false);
    expect(verifyQuote(text, "all terminals are closed.")).toBe(false);
    expect(verifyQuote(text, "  ")).toBe(false);
  });
});
