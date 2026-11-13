/**
 * OWNER: Engine thread. SKELETON from Foundation.
 *
 * The five disjointness checks. RULES (do not break):
 *  - Pure functions: no I/O, no clock, no randomness, no LLM.
 *  - UNKNOWN never counts as PASS. Missing data => UNKNOWN. An UNKNOWN
 *    placeholder key (value "?") on either side => UNKNOWN for that type.
 *  - A FAIL needs evidence (the shared key's sourceUrl) whenever one exists.
 *  - Every result carries a one-sentence `reason` for the table.
 *
 * Signatures are stable; the bodies below are stubs that return UNKNOWN.
 */
import type { CheckResult, FootprintKey } from "@secondsource/shared";

export { regionCovers, regionsOverlap } from "./regions";

export interface CheckInput {
  /** Keys of the incident (what it touches). */
  incident: FootprintKey[];
  /** Footprint of the candidate supplier. */
  candidate: FootprintKey[];
  /** Footprint of the candidate's OWN upstream (tier-2) suppliers; PLANT/REGION/PORT keys. Empty => unknown. */
  candidateUpstream: FootprintKey[];
  /** Footprint of the affected supplier being replaced (for the shared-parent test). */
  affectedSupplier: FootprintKey[];
}

export type CheckFn = (input: CheckInput) => CheckResult;

const notImplemented = (check: CheckResult["check"]): CheckFn => () => ({
  check,
  status: "UNKNOWN",
  reason: `${check} not implemented yet (Engine thread)`,
  evidence: [],
});

/** C1 Region: no shared region, including parent/child regions (FI covers FI-UUS). */
export const c1Region: CheckFn = notImplemented("C1");
/** C2 Port: no shared port, including inbound lanes. */
export const c2Port: CheckFn = notImplemented("C2");
/** C3 Upstream plant: the candidate's own tier-2 suppliers don't touch the incident's plants. */
export const c3UpstreamPlant: CheckFn = notImplemented("C3");
/** C4 Sanction: neither the candidate nor its parent is on the incident's sanctions programme. */
export const c4Sanction: CheckFn = notImplemented("C4");
/** C5 Parent: no shared owner within 2 hops with the affected supplier or the incident's PARENT keys. */
export const c5Parent: CheckFn = notImplemented("C5");

export const ALL_CHECKS: ReadonlyArray<CheckFn> = [c1Region, c2Port, c3UpstreamPlant, c4Sanction, c5Parent];

export function runAllChecks(input: CheckInput): CheckResult[] {
  return ALL_CHECKS.map((fn) => fn(input));
}

/** Verdict helper contract: any FAIL => FAILED; else any UNKNOWN => UNVERIFIED; else VERIFIED. */
export function verdictOf(results: ReadonlyArray<Pick<CheckResult, "status">>): "VERIFIED" | "UNVERIFIED" | "FAILED" {
  if (results.some((r) => r.status === "FAIL")) return "FAILED";
  if (results.some((r) => r.status === "UNKNOWN")) return "UNVERIFIED";
  return "VERIFIED";
}
