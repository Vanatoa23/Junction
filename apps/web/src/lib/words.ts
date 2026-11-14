import type { CheckId, MapSupplier, RiskLevel, SupplierRow, Verdict } from "@secondsource/shared";

/** Plain-language wording. No technical terms reach the screen. */

export const RISK_COLOR: Record<RiskLevel, string> = { LOW: "#2f7d6d", MEDIUM: "#c97a12", HIGH: "#c2412d" };
export const RISK_WORD: Record<RiskLevel, string> = { LOW: "Low risk", MEDIUM: "Medium risk", HIGH: "High risk" };
export const SEVERITY_WORD: Record<string, string> = { LOW: "Minor", MEDIUM: "Moderate", HIGH: "Serious", CRITICAL: "Severe" };

export function statusWord(status: MapSupplier["status"]): string {
  switch (status) {
    case "PENDING": return "Looking it up…";
    case "RESOLVED": return "Added";
    case "MONITORED": return "Watching";
    case "AMBIGUOUS": return "Needs your choice";
    case "UNRESOLVED": return "Could not find it";
  }
}

export const VERDICT_WORD: Record<Verdict, string> = { VERIFIED: "Safe to approve", UNVERIFIED: "Needs a check", FAILED: "Ruled out" };

/** The five checks in everyday words (shown under "How we know"). */
export const CHECK_WORD: Record<CheckId, string> = {
  C1: "Different region", C2: "Different port", C3: "Their own suppliers are clear", C4: "No sanctions problem", C5: "Different owner",
  LIVE_NEWS: "Recent news",
};

export const CRITICALITY_WORD = { LOW: "Nice to have", MEDIUM: "Important", HIGH: "Critical" } as const;

export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} seconds ago`;
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export function noticedWord(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 90) return `Noticed within ${Math.max(1, seconds)} seconds of the notice`;
  return `Noticed ${Math.round(seconds / 60)} minutes after the notice`;
}

/** What we found and could not find about a supplier, from its footprint. */
export function foundLines(row: SupplierRow | undefined): { found: string[]; missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  if (!row) return { found, missing };
  if (row.company?.domain) found.push(`website (${row.company.domain})`);
  const kinds: Array<[string, string]> = [["REGION", "where it operates"], ["PORT", "the ports it ships through"], ["PLANT", "its factories"], ["PARENT", "who owns it"]];
  for (const [type, label] of kinds) {
    const keys = row.footprint.filter((k) => k.type === type);
    const known = keys.filter((k) => k.state !== "UNKNOWN");
    if (known.length) found.push(label);
    else if (row.company) missing.push(label);
  }
  return { found, missing };
}

/** One plain sentence per failed / unknown check (no technical text from the checks reaches the screen). */
export const FAIL_WORD: Partial<Record<CheckId, string>> = {
  C1: "It is in the same region as the disruption.",
  C2: "It ships through the same port.",
  C3: "One of its own suppliers is in the affected area.",
  C4: "It has a sanctions problem.",
  C5: "It has the same owner as the supplier you are replacing.",
  LIVE_NEWS: "Recent news mentions the same kind of problem there.",
};
export const UNKNOWN_WORD: Partial<Record<CheckId, string>> = {
  C1: "We do not know where it operates.",
  C2: "We do not know which port it ships through.",
  C3: "We could not find its own suppliers.",
  C4: "We have no sanctions information.",
  C5: "We could not find who owns it.",
};
export const PASS_WORD: Partial<Record<CheckId, string>> = {
  C1: "It operates in a different region.",
  C2: "It ships through a different port.",
  C3: "Its own suppliers are not affected.",
  C4: "No sanctions problem.",
  C5: "It has a different owner.",
};
