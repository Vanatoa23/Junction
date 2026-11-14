import type { CheckResult, IncidentType, SourceMode } from "@secondsource/shared";
import { source } from "../source";

/**
 * STRETCH: live news re-check of a candidate (report: "a fresh news search on the candidate's region shows no
 * sign of the same incident type in the last 14 days").
 *
 * Interface: liveNewsCheck(candidate, incidentType) -> { result: CheckResult (check "LIVE_NEWS"), mode }.
 *  - No Context.dev key (and no REC fixture): NOT RUN. Returns UNKNOWN with a reason that says so, mode SEED.
 *    It performs no search and never invents a result. The verdict ignores a not-run LIVE_NEWS.
 *  - LIVE/REC: scans titles/descriptions of articles from the last 14 days for incident-type keywords.
 *    A hit is FAIL (excludes the candidate) with the article URLs as evidence; none is PASS.
 *
 * !! UNVERIFIED !! The response parsing follows docs/api-findings.md (news_search -> data[] with url, title,
 * description, published_at in epoch ms or ISO). Never run against the real service.
 */
const KEYWORDS: Record<IncidentType, RegExp> = {
  STRIKE: /\b(strike|walkout|industrial action)\b/i,
  FIRE: /\b(fire|explosion)\b/i,
  RECALL: /\brecall/i,
  SANCTION: /\b(sanction|embargo)/i,
  INSOLVENCY: /\b(insolven|bankrupt)/i,
  PORT_CLOSURE: /\bport (closure|closed)\b/i,
  WEATHER: /\b(storm|flood|hurricane)\b/i,
  CYBER: /\b(cyber|ransomware)/i,
  OTHER: /$^/,
};
const WINDOW_MS = 14 * 24 * 3600_000;

export async function liveNewsCheck(
  candidate: { name: string; domain: string | null }, incidentType: IncidentType,
): Promise<{ result: CheckResult; mode: SourceMode }> {
  const r = await source<{ data?: Array<{ url?: string; title?: string; description?: string; published_at?: number | string }> }>({
    provider: "contextdev", op: "news_search", params: { name: candidate.name, ...(candidate.domain ? { domain: candidate.domain } : {}), limit: 10 },
  });
  if (!r.ok || (r.mode !== "LIVE" && r.mode !== "REC")) {
    return {
      mode: "SEED",
      result: { check: "LIVE_NEWS", status: "UNKNOWN", reason: "Live news check not run (no Context.dev key; SEED stand-in, no news was searched).", evidence: [] },
    };
  }
  const now = new Date(r.recordedAt ?? r.fetchedAt).getTime();
  const re = KEYWORDS[incidentType];
  const hits = (r.data?.data ?? []).filter((a) => {
    const t = a.published_at === undefined ? now : new Date(a.published_at).getTime();
    return now - t <= WINDOW_MS && re.test(`${a.title ?? ""} ${a.description ?? ""}`);
  });
  if (hits.length) {
    return {
      mode: r.mode,
      result: {
        check: "LIVE_NEWS", status: "FAIL", reason: `${hits.length} news item(s) in the last 14 days mention the same incident type for this candidate.`,
        evidence: hits.filter((h) => h.url).map((h) => ({ url: h.url!, quote: h.title ?? null, mode: r.mode, provider: "contextdev" as const })),
      },
    };
  }
  return {
    mode: r.mode,
    result: { check: "LIVE_NEWS", status: "PASS", reason: "No news item in the last 14 days mentions the same incident type for this candidate.", evidence: [] },
  };
}
