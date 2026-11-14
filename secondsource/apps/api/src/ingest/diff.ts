import { createHash } from "node:crypto";

/**
 * Normalise scraped text so layout/timestamp-only changes do not count as a change:
 * drops "Last updated: ..." lines, collapses whitespace, trims lines, removes blank lines.
 */
export function normalise(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^last updated\b/i.test(l))
    .join("\n");
}

export const hashText = (text: string) => createHash("sha256").update(text).digest("hex");

/** Line diff of normalised text: "+ added" / "- removed" lines (set based; enough for a notice page). */
export function lineDiff(before: string, after: string): string[] {
  const a = before.split("\n"), b = after.split("\n");
  const sa = new Set(a), sb = new Set(b);
  return [...a.filter((l) => !sb.has(l)).map((l) => `- ${l}`), ...b.filter((l) => !sa.has(l)).map((l) => `+ ${l}`)];
}

/** The TEST page states its own update time ("Last updated: <iso>"): the only honest t_source we have for it. */
export function parseLastUpdated(text: string): string | null {
  const m = text.match(/last updated:\s*(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)/i);
  const d = m ? new Date(m[1]) : null;
  return d && !isNaN(d.getTime()) ? d.toISOString() : null;
}
