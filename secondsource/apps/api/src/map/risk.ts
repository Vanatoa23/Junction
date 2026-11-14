import { incidentHeadline, placeLabel, type FootprintKey, type Incident, type RiskLevel, type SupplierRisk } from "@secondsource/shared";
import { matchKeys } from "../engine/matching";

/**
 * Per-supplier risk score. Pure function (no I/O): the caller loads the supplier's own footprint, its DEEPER tiers
 * (their suppliers and theirs: researched in the background, never drawn) and the open incidents.
 *
 * Score = 12 (base) + incident exposure + concentration + thin-coverage penalty, capped at 100.
 *  - direct hit (incident keys touch the supplier's own keys): severity weight (inferred-only keys count 80%)
 *  - deeper hit (some of its own suppliers are exposed): half the weight, scaled by how many of them are
 *  - concentration: most of its own suppliers rely on one port: +10
 *  - no deeper-tier data found: +8 and coverage LIMITED (the score may be too low; the UI says so)
 * Level: < 30 LOW, < 60 MEDIUM, otherwise HIGH. Every point has a plain-language reason.
 */
export interface DeeperNode {
  name: string;
  tier: number;
  keys: FootprintKey[];
}

const WEIGHT: Record<Incident["severity"], number> = { LOW: 12, MEDIUM: 30, HIGH: 50, CRITICAL: 60 };
const level = (score: number): RiskLevel => (score < 30 ? "LOW" : score < 60 ? "MEDIUM" : "HIGH");
const real = (k: FootprintKey) => k.state !== "UNKNOWN" && k.value !== "?";

function why(m: { incident: FootprintKey; supplier: FootprintKey }): string {
  const place = placeLabel(m.incident.type, m.incident.value);
  if (m.supplier.type === "PORT") return `it ships through ${place}`;
  if (m.supplier.type === "REGION") return `it is based in ${place}`;
  if (m.supplier.type === "PLANT") return "one of its plants is affected";
  if (m.supplier.type === "SANCTION") return "it falls under the new sanctions";
  return "it shares an owner with an affected company";
}

export function scoreSupplier(own: FootprintKey[], deeper: DeeperNode[], incidents: Incident[]): SupplierRisk {
  let score = 12;
  const reasons: string[] = [];

  for (const inc of incidents) {
    const headline = incidentHeadline(inc.type, inc.footprint);
    const w = WEIGHT[inc.severity];

    const direct = matchKeys(inc.footprint, own);
    if (direct.length) {
      const inferredOnly = direct.every((m) => m.supplier.state !== "CONFIRMED");
      score += Math.round(inferredOnly ? w * 0.8 : w);
      reasons.push(`${headline}: ${why(direct[0]!)}${inferredOnly ? " (we think so, not confirmed)" : ""}.`);
    }

    const hits = deeper.filter((d) => matchKeys(inc.footprint, d.keys).length > 0);
    if (hits.length) {
      const share = hits.length / deeper.length;
      score += Math.round(w * 0.5 * Math.min(1, share * 1.5));
      const m = matchKeys(inc.footprint, hits[0]!.keys)[0]!;
      reasons.push(`${hits.length} of its ${deeper.length} own suppliers also depend on ${placeLabel(m.incident.type, m.incident.value)}${direct.length ? "" : ` (${headline.toLowerCase()})`}.`);
    }
  }

  // concentration among its direct suppliers' ports (tier 2), independent of any incident
  const tier2 = deeper.filter((d) => d.tier === 2);
  if (tier2.length >= 2) {
    const counts = new Map<string, number>();
    for (const d of tier2) for (const v of new Set(d.keys.filter((k) => k.type === "PORT" && real(k)).map((k) => k.value))) counts.set(v, (counts.get(v) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2 && top[1] / tier2.length >= 0.5) {
      score += 10;
      reasons.push(`Most of its own suppliers (${top[1]} of ${tier2.length}) ship through ${placeLabel("PORT", top[0])}.`);
    }
  }

  const coverage = deeper.length === 0 ? "LIMITED" : "GOOD";
  if (coverage === "LIMITED") {
    score += 8;
    reasons.push("We have not found who supplies them yet, so this score may be too low.");
  } else if (!reasons.length) {
    reasons.push(`No disruption found for it or its ${deeper.length} suppliers.`);
  }

  const capped = Math.min(100, score);
  return { score: capped, level: level(capped), reasons, deeperChecked: deeper.length, coverage };
}
