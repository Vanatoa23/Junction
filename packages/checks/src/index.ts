/**
 * OWNER: Engine thread.
 *
 * The five disjointness checks C1..C5. RULES (never break):
 *  - Pure functions: no I/O, no clock, no randomness, no LLM.
 *  - UNKNOWN never counts as PASS. Missing data, or the UNKNOWN placeholder key (value "?"), gives UNKNOWN,
 *    unless an overlap is found in the data we DO have: then FAIL (a FAIL outranks UNKNOWN).
 *  - A FAIL carries evidence (the overlapping key's sourceUrl) whenever one exists. Seeded keys have no URL;
 *    then the `reason` names the overlapping key and says it is seeded.
 *  - Every result has a one-sentence `reason` for the table.
 *  - Evidence `mode` here is PROVISIONAL (SEED if the key is seeded, else LIVE): the engine rewrites it from
 *    the stored footprint_key.mode before persisting. Never display it straight from here.
 *
 * Verdict (verdictOf): any FAIL => FAILED; else any UNKNOWN => UNVERIFIED; else VERIFIED.
 * It looks at C1..C5 only. LIVE_NEWS is handled by the engine (see engine/liveNews.ts): a FAIL excludes the
 * candidate, a PASS or "not run" does not change the verdict.
 */
import { UNKNOWN_VALUE, type CheckId, type CheckResult, type Evidence, type FootprintKey, type FootprintType } from "@secondsource/shared";
import { regionsOverlap } from "./regions";

export { regionCovers, regionsOverlap } from "./regions";

export interface CheckInput {
  /** Keys of the incident (what it touches). */
  incident: FootprintKey[];
  /** Footprint of the candidate supplier. */
  candidate: FootprintKey[];
  /** Footprint keys of the candidate's OWN upstream (tier-2) suppliers, all merged. Empty => unknown. */
  candidateUpstream: FootprintKey[];
  /** Footprint of the affected supplier being replaced (for the shared-parent test). */
  affectedSupplier: FootprintKey[];
  /** Optional: footprint of the candidate's parent company (for the parent half of C4). */
  candidateParent?: FootprintKey[];
}

export type CheckFn = (input: CheckInput) => CheckResult;

// ---------------------------------------------------------------- helpers
const known = (keys: FootprintKey[], type: FootprintType) =>
  keys.filter((k) => k.type === type && k.state !== "UNKNOWN" && k.value !== UNKNOWN_VALUE);
const label = (k: FootprintKey) => `${k.type}:${k.value}${k.seeded ? " (seeded)" : ""}`;
const eqU = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();

function evidenceOf(keys: FootprintKey[]): Evidence[] {
  const seen = new Set<string>();
  const out: Evidence[] = [];
  for (const k of keys) {
    if (!k.sourceUrl || seen.has(k.sourceUrl)) continue;
    seen.add(k.sourceUrl);
    out.push({ url: k.sourceUrl, quote: k.sourceQuote, mode: k.seeded ? "SEED" : "LIVE", provider: null });
  }
  return out;
}

const result = (check: CheckId, status: CheckResult["status"], reason: string, evidenceKeys: FootprintKey[] = []): CheckResult => ({
  check, status, reason, evidence: evidenceOf(evidenceKeys),
});

/** Generic "shared value" comparison used by C1 (nested regions) and C2 (exact ports). */
function sharedCheck(
  check: CheckId, type: FootprintType, noun: string, eq: (a: string, b: string) => boolean, input: CheckInput,
): CheckResult {
  const inc = known(input.incident, type);
  if (inc.length === 0) return result(check, "PASS", `Incident names no ${noun}, so there is nothing to share.`);
  const cand = known(input.candidate, type);
  const overlaps = inc.flatMap((i) => cand.filter((c) => eq(i.value, c.value)).map((c) => [i, c] as const));
  if (overlaps.length) {
    const [i, c] = overlaps[0]!;
    return result(check, "FAIL", `Candidate shares ${noun} ${c.value} with the incident (${label(i)} vs ${label(c)}).`, overlaps.flat());
  }
  if (cand.length === 0) return result(check, "UNKNOWN", `No ${noun} data for the candidate; cannot confirm it is clear of the incident.`);
  return result(check, "PASS", `Candidate ${noun}s (${cand.map((c) => c.value).join(", ")}) do not overlap the incident's (${inc.map((i) => i.value).join(", ")}).`, cand);
}

// ---------------------------------------------------------------- checks
/** C1 Region: no shared region, including parent/child regions (FI covers FI-UUS). */
export const c1Region: CheckFn = (input) => sharedCheck("C1", "REGION", "region", regionsOverlap, input);

/** C2 Port: no shared port, including inbound lanes. */
export const c2Port: CheckFn = (input) => sharedCheck("C2", "PORT", "port", eqU, input);

/**
 * C3 Upstream plant: the candidate's own tier-2 suppliers must not touch the incident.
 * FAIL if an upstream PLANT equals an incident PLANT, an upstream REGION overlaps an incident REGION,
 * or an upstream PORT equals an incident PORT. PASS needs at least one known upstream key and no overlap.
 */
export const c3UpstreamPlant: CheckFn = (input) => {
  const pairs: Array<[FootprintType, (a: string, b: string) => boolean]> = [["PLANT", eqU], ["REGION", regionsOverlap], ["PORT", eqU]];
  for (const [type, eq] of pairs) {
    for (const i of known(input.incident, type)) {
      const hit = known(input.candidateUpstream, type).find((u) => eq(i.value, u.value));
      if (hit) return result("C3", "FAIL", `A tier-2 supplier of the candidate touches the incident (${label(hit)} vs ${label(i)}).`, [i, hit]);
    }
  }
  const upstreamKnown = input.candidateUpstream.filter((k) => k.state !== "UNKNOWN" && k.value !== UNKNOWN_VALUE);
  if (upstreamKnown.length === 0) return result("C3", "UNKNOWN", "No tier-2 data for the candidate; cannot confirm its upstream is clear.");
  return result("C3", "PASS", `Candidate's tier-2 suppliers (${upstreamKnown.map((k) => k.value).join(", ")}) do not touch the incident's plants, regions or ports.`, upstreamKnown);
};

/**
 * C4 Sanction: neither the candidate nor its parent carries the incident's sanction programme.
 * If the incident has no SANCTION keys the check passes (not a sanctions incident). For a sanctions incident,
 * absence of sanction data is UNKNOWN (we cannot prove "not listed" from silence).
 */
export const c4Sanction: CheckFn = (input) => {
  const inc = known(input.incident, "SANCTION");
  if (inc.length === 0) return result("C4", "PASS", "Incident is not tied to a sanctions programme.");
  const own = [...known(input.candidate, "SANCTION"), ...known(input.candidateParent ?? [], "SANCTION")];
  const hit = inc.flatMap((i) => own.filter((o) => o.value === i.value).map((o) => [i, o] as const))[0];
  if (hit) return result("C4", "FAIL", `Candidate or its parent is on the incident's sanctions programme ${hit[0].value}.`, [hit[0], hit[1]]);
  if (own.length === 0) return result("C4", "UNKNOWN", "No sanctions screening data for the candidate or its parent.");
  return result("C4", "PASS", "Candidate and its parent are not on the incident's sanctions programme.", own);
};

/**
 * C5 Parent: no shared owner with the affected supplier or with an owner named by the incident.
 * Limitation: we only hold the ultimate-parent key (PARENT), not a full 2-hop chain.
 */
export const c5Parent: CheckFn = (input) => {
  const cand = known(input.candidate, "PARENT");
  const against = [...known(input.affectedSupplier, "PARENT"), ...known(input.incident, "PARENT")];
  const hit = against.flatMap((a) => cand.filter((c) => c.value === a.value).map((c) => [a, c] as const))[0];
  if (hit) return result("C5", "FAIL", `Candidate shares owner ${hit[1].value} with the affected supplier or the incident.`, [hit[0], hit[1]]);
  if (cand.length === 0) return result("C5", "UNKNOWN", "No ownership data for the candidate; a shared owner cannot be ruled out.");
  if (against.length === 0) return result("C5", "UNKNOWN", "No ownership data for the affected supplier; a shared owner cannot be ruled out.");
  return result("C5", "PASS", `Candidate owner (${cand.map((c) => c.value).join(", ")}) differs from the affected supplier's.`, cand);
};

export const ALL_CHECKS: ReadonlyArray<CheckFn> = [c1Region, c2Port, c3UpstreamPlant, c4Sanction, c5Parent];

export function runAllChecks(input: CheckInput): CheckResult[] {
  return ALL_CHECKS.map((fn) => fn(input));
}

export type Verdict = "VERIFIED" | "UNVERIFIED" | "FAILED";

/** Any FAIL => FAILED; else any UNKNOWN => UNVERIFIED; else VERIFIED. Only pass C1..C5 results (see header). */
export function verdictOf(results: ReadonlyArray<Pick<CheckResult, "status">>): Verdict {
  if (results.some((r) => r.status === "FAIL")) return "FAILED";
  if (results.some((r) => r.status === "UNKNOWN")) return "UNVERIFIED";
  return "VERIFIED";
}

const VERDICT_ORDER: Record<Verdict, number> = { VERIFIED: 0, UNVERIFIED: 1, FAILED: 2 };

/**
 * Ranking contract: VERIFIED first, then UNVERIFIED, then FAILED (an UNVERIFIED candidate never outranks a
 * VERIFIED one). Within a verdict: fewer FAILs, then fewer UNKNOWNs, then name (deterministic).
 * Capacity fit / product match / lead time are not available in the MVP data, so they are not used.
 */
export function rankCandidates<T extends { name: string; verdict: Verdict; results: ReadonlyArray<Pick<CheckResult, "status">> }>(items: T[]): T[] {
  const count = (t: T, s: CheckResult["status"]) => t.results.filter((r) => r.status === s).length;
  return [...items].sort(
    (a, b) =>
      VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] ||
      count(a, "FAIL") - count(b, "FAIL") ||
      count(a, "UNKNOWN") - count(b, "UNKNOWN") ||
      a.name.localeCompare(b.name),
  );
}
