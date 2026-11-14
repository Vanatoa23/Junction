import type { SourceMode } from "@secondsource/shared";
import { nameSimilarity } from "./similarity";

/**
 * Resolver scoring (PLAN.md W3):
 *   score = 0.5 * name similarity + 0.2 * country + 0.3 * source agreement on the domain
 *   >= 0.85 auto-accept, 0.6 <= score < 0.85 AMBIGUOUS (chooser), < 0.6 UNRESOLVED (needs a domain)
 *
 * Definitions (documented because the plan leaves them open):
 *  - country: 1 if input and candidate agree, 0 if both known and different, 0.5 (neutral) if either is unknown.
 *  - agreement: share of the sources that answered which report this candidate's domain,
 *    denominator never below 2 so one lonely source cannot score full agreement.
 *    A domain typed by the user that equals the candidate's domain counts as full agreement (1.0);
 *    a typed domain that differs counts as 0.
 *  - near-tie guard: if the runner-up (different domain) is within 0.05 of an auto-accept winner, the row is AMBIGUOUS.
 */
export const WEIGHTS = { name: 0.5, country: 0.2, agreement: 0.3 } as const;
export const AUTO_ACCEPT = 0.85;
export const AMBIGUOUS_MIN = 0.6;
export const TIE_MARGIN = 0.05;

export type SourceName = "contextdev" | "exa" | "cala";

export interface Candidate {
  name: string;
  domain: string | null;
  country: string | null;
  /** Sources that reported this entity. */
  sources: SourceName[];
  calaId: string | null;
  sourceUrls: string[];
  mode: SourceMode;
}

export interface ScoreInput {
  name: string;
  domain: string | null;
  country: string | null;
}

export interface ScoreBreakdown {
  total: number;
  name: number;
  country: number;
  agreement: number;
}

export function scoreCandidate(input: ScoreInput, c: Candidate, answeredSources: number): ScoreBreakdown {
  const name = nameSimilarity(input.name, c.name);
  const country = !input.country || !c.country ? 0.5 : input.country === c.country ? 1 : 0;
  let agreement: number;
  if (input.domain) {
    agreement = c.domain && c.domain === input.domain ? 1 : 0;
  } else {
    agreement = Math.min(1, new Set(c.sources).size / Math.max(2, answeredSources));
  }
  const total = WEIGHTS.name * name + WEIGHTS.country * country + WEIGHTS.agreement * agreement;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return { total: r(total), name: r(name), country: r(country), agreement: r(agreement) };
}

export type Decision =
  | { kind: "ACCEPT"; best: Scored }
  | { kind: "AMBIGUOUS"; ranked: Scored[]; reason: string }
  | { kind: "UNRESOLVED"; ranked: Scored[]; reason: string };

export interface Scored { candidate: Candidate; breakdown: ScoreBreakdown }

export function rank(input: ScoreInput, candidates: Candidate[], answeredSources: number): Scored[] {
  return candidates
    .map((candidate) => ({ candidate, breakdown: scoreCandidate(input, candidate, answeredSources) }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total || a.candidate.name.localeCompare(b.candidate.name));
}

export function decide(ranked: Scored[]): Decision {
  const best = ranked.find((s) => s.candidate.domain);
  if (!best) return { kind: "UNRESOLVED", ranked, reason: "no candidate with a domain was found" };
  const s = best.breakdown.total;
  if (s >= AUTO_ACCEPT) {
    const runnerUp = ranked.find((x) => x !== best && x.candidate.domain && x.candidate.domain !== best.candidate.domain);
    if (runnerUp && s - runnerUp.breakdown.total <= TIE_MARGIN) {
      return { kind: "AMBIGUOUS", ranked, reason: `close runner-up "${runnerUp.candidate.name}" (${runnerUp.breakdown.total})` };
    }
    return { kind: "ACCEPT", best };
  }
  if (s >= AMBIGUOUS_MIN) return { kind: "AMBIGUOUS", ranked, reason: `best score ${s} is below ${AUTO_ACCEPT}` };
  return { kind: "UNRESOLVED", ranked, reason: `best score ${s} is below ${AMBIGUOUS_MIN}: needs a domain` };
}
