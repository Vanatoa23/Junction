import type { ClassifiedKey, ClassifyOutput, IncidentType, Severity } from "@secondsource/shared";
import { allPorts, SANCTION_PROGRAMMES } from "./gazetteer";

/**
 * Deterministic RULE-BASED classifier: the SEED-mode stand-in for Gemini (no key, no network).
 * Reports classifier "rule-based-v1" and is surfaced with mode SEED. It is NOT an LLM and is
 * intentionally simple: keyword type, severity words, gazetteer for ports/regions.
 * Its quote is always a verbatim sentence of the input, and the Engine still runs verifyQuote().
 */
const TYPES: Array<[IncidentType, RegExp]> = [
  ["STRIKE", /\b(strike|strikes|walkout|industrial action)\b/i],
  ["PORT_CLOSURE", /\bport (closure|closed)\b|\bterminals? (is|are) closed\b/i],
  ["FIRE", /\b(fire|explosion)\b/i],
  ["RECALL", /\brecall(s|ed)?\b/i],
  ["SANCTION", /\b(sanction|sanctions|embargo)\b/i],
  ["INSOLVENCY", /\b(insolvency|bankruptcy|bankrupt)\b/i],
  ["WEATHER", /\b(storm|flood|flooding|hurricane)\b/i],
  ["CYBER", /\b(cyber ?attack|ransomware)\b/i],
];
const NEGATED = /\bno (active )?(disruption|incident|strike)|operat\w+ normally|no notices?\b/i;

const sentences = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export function classifyRuleBased(text: string): ClassifyOutput {
  const classifier = "rule-based-v1";
  const all = sentences(text);
  const hits = all.filter((s) => !NEGATED.test(s));
  let type: IncidentType | null = null;
  let quote = "";
  for (const [t, re] of TYPES) {
    const s = hits.find((x) => re.test(x));
    if (s) { type = t; quote = s; break; }
  }
  if (!type) return { incident: false, classifier, reason: "no incident keyword found" };

  const severity: Severity = /\b(closed|halted|shut ?down|suspend\w*|until further notice)\b/i.test(text)
    ? "HIGH"
    : /\b(delay\w*|disrupt\w*|reduced)\b/i.test(text) ? "MEDIUM" : "LOW";

  const keys: ClassifiedKey[] = [];
  const add = (k: ClassifiedKey) => { if (!keys.some((x) => x.type === k.type && x.value === k.value)) keys.push(k); };
  const unmapped: string[] = [];

  const ports = allPorts();
  const escapeRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const p of ports) {
    const byName = new RegExp(`\\b${escapeRe(p.name)}\\b`, "i");
    const named = all.find((s) => byName.test(s) || s.includes(p.locode));
    if (named) {
      add({ type: "PORT", value: p.locode, state: "CONFIRMED", quote: named });
      if (p.region) add({ type: "REGION", value: p.region, state: "INFERRED", quote: named });
    }
  }
  // explicit region codes like NL-ZH are CONFIRMED (they are in the text)
  for (const m of text.matchAll(/\b([A-Z]{2}-[A-Z0-9]{1,3})\b/g)) {
    add({ type: "REGION", value: m[1]!, state: "CONFIRMED", quote: all.find((s) => s.includes(m[1]!)) ?? null });
  }
  for (const sp of SANCTION_PROGRAMMES) if (sp.pattern.test(text)) add({ type: "SANCTION", value: sp.id, state: "CONFIRMED", quote });
  // "Port of X" where X is not in the gazetteer cannot be mapped -> blocks the automatic alert
  for (const m of text.matchAll(/\bPort of ([A-Z][\w-]+)/g)) {
    const rest = text.slice((m.index ?? 0) + "Port of ".length).toLowerCase();
    if (!ports.some((p) => rest.startsWith(p.name.toLowerCase()))) unmapped.push(`Port of ${m[1]}`);
  }

  const title = quote.length > 90 ? quote.slice(0, 87) + "..." : quote;
  return { incident: true, classifier, type, severity, title, quote, keys, unmappedNames: [...new Set(unmapped)] };
}
