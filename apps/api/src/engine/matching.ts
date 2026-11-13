import { UNKNOWN_VALUE, type FootprintKey } from "@secondsource/shared";
import { regionsOverlap } from "@secondsource/checks";

/**
 * Pure footprint matching: which supplier keys does the incident touch?
 * REGION matches are nested (FI covers FI-UUS, either direction); every other type is an exact,
 * case-insensitive match. UNKNOWN placeholder keys never match (and never count as "clear" either:
 * that is the checks' job, not matching's).
 */
export interface KeyMatch {
  incident: FootprintKey;
  supplier: FootprintKey;
}

const real = (k: FootprintKey) => k.state !== "UNKNOWN" && k.value !== UNKNOWN_VALUE;
const eq = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();

export function matchKeys(incident: FootprintKey[], supplier: FootprintKey[]): KeyMatch[] {
  const out: KeyMatch[] = [];
  for (const i of incident.filter(real)) {
    for (const s of supplier.filter(real)) {
      if (i.type !== s.type) continue;
      if (i.type === "REGION" ? regionsOverlap(i.value, s.value) : eq(i.value, s.value)) out.push({ incident: i, supplier: s });
    }
  }
  return out;
}
