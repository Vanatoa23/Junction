import type { SourceMode } from "@secondsource/shared";
import { source } from "../source";
import { CATALOG, catalogByDomain } from "./demoCatalog";
import { nameSimilarity, normalizeDomain } from "./similarity";
import type { Candidate, SourceName } from "./scoring";

/**
 * Gathers resolver candidates. Every vendor call goes through source() (never fetch).
 * Context.dev company search and Cala entity search run in parallel; Exa search is a fallback used only
 * when Context.dev produced no candidate with a domain. One supplier name per call, never the client name
 * or the whole list (PLAN rule 6).
 *
 * When a provider answered from SEED data (no key), the onboarding seed catalog is added on top, labelled SEED.
 * It is never added to a LIVE or REC answer.
 *
 * LIVE response shapes are UNVERIFIED (docs/api-findings.md); parsing is defensive and ignores what it cannot read.
 */
const MODE_RANK: Record<SourceMode, number> = { SEED: 0, LOCAL: 0, REC: 1, LIVE: 2 };
const weakest = (a: SourceMode, b: SourceMode): SourceMode => (MODE_RANK[a] <= MODE_RANK[b] ? a : b);
const CATALOG_MIN_NAME_SIM = 0.5;

export interface LookupResult {
  candidates: Candidate[];
  /** Sources that returned at least one candidate. */
  answered: SourceName[];
  notes: string[];
}

interface Raw { name: string; domain: string | null; country: string | null; calaId: string | null; urls: string[]; mode: SourceMode }

const host = (url: unknown) => {
  try { return normalizeDomain(new URL(String(url)).hostname); } catch { return null; }
};

function parseContextdev(data: any, mode: SourceMode): Raw[] {
  return (Array.isArray(data?.results) ? data.results : []).flatMap((r: any): Raw[] => {
    const name = r?.name ?? r?.legal_name;
    if (typeof name !== "string") return [];
    const domain = normalizeDomain(r.domain);
    const cc = r?.headquarters?.country_code;
    return [{ name, domain, country: typeof cc === "string" ? cc.toUpperCase() : null, calaId: null, urls: domain ? [`https://${domain}`] : [], mode }];
  });
}
function parseCala(data: any, mode: SourceMode): Raw[] {
  return (Array.isArray(data?.entities) ? data.entities : []).flatMap((e: any): Raw[] =>
    typeof e?.name === "string" ? [{ name: e.name, domain: null, country: null, calaId: typeof e.id === "string" ? e.id : null, urls: [], mode }] : []);
}
function parseExa(data: any, mode: SourceMode): Raw[] {
  return (Array.isArray(data?.results) ? data.results : []).flatMap((r: any): Raw[] => {
    const ent = Array.isArray(r?.entities) ? r.entities[0] : null;
    const name = ent?.name ?? r?.title;
    const domain = host(r?.url);
    if (typeof name !== "string" || !domain) return [];
    const c = ent?.headquarters?.country;
    return [{ name, domain, country: typeof c === "string" && c.length === 2 ? c.toUpperCase() : null, calaId: null, urls: [String(r.url)], mode }];
  });
}

const fromCatalog = (e: (typeof CATALOG)[number], src: SourceName): Raw => ({
  name: e.name,
  // Cala does not return domains; the merge step attaches its hit to the matching domain candidate by name.
  domain: src === "cala" ? null : e.domain,
  country: src === "cala" ? null : e.country,
  calaId: src === "cala" ? `seed:${e.domain}` : null,
  urls: src === "cala" ? [] : [`https://${e.domain}/`],
  mode: "SEED",
});

export interface LookupInput { name: string; domain: string | null; country: string | null }

export async function lookupCandidates(input: LookupInput): Promise<LookupResult> {
  const notes: string[] = [];
  const bySource: Array<{ src: SourceName; raws: Raw[] }> = [];

  const [cd, ca] = await Promise.all([
    source({ provider: "contextdev", op: "company_search", params: { query: input.name, ...(input.country ? { countries: [input.country] } : {}), ...(input.domain ? { domain: input.domain } : {}) } }),
    source({ provider: "cala", op: "entity_search", params: { name: input.name, limit: 5 } }),
  ]);

  const catalogFor = (src: SourceName) =>
    CATALOG.filter((e) => e.sources.includes(src) && (nameSimilarity(input.name, e.name) >= CATALOG_MIN_NAME_SIM || (!!input.domain && e.domain === input.domain)))
      .map((e) => fromCatalog(e, src));

  const seedWorld = (r: { ok: boolean; mode: SourceMode }) => !r.ok || r.mode === "SEED";

  const cdRaws = cd.ok ? parseContextdev(cd.data, cd.mode) : [];
  if (seedWorld(cd)) cdRaws.push(...catalogFor("contextdev"));
  bySource.push({ src: "contextdev", raws: cdRaws });

  const caRaws = ca.ok ? parseCala(ca.data, ca.mode) : [];
  if (seedWorld(ca)) caRaws.push(...catalogFor("cala"));
  bySource.push({ src: "cala", raws: caRaws });

  if (!cdRaws.some((r) => r.domain)) {
    const ex = await source({ provider: "exa", op: "search", params: { query: input.name, category: "company", numResults: 5 } });
    const exRaws = ex.ok ? parseExa(ex.data, ex.mode) : [];
    if (seedWorld(ex)) exRaws.push(...catalogFor("exa"));
    bySource.push({ src: "exa", raws: exRaws });
    notes.push("exa used as fallback: contextdev returned no domain");
  }

  return merge(bySource, notes);
}

/** Merge per-source hits into candidates keyed by domain; domain-less hits (Cala) join a domain candidate whose name matches. */
function merge(bySource: Array<{ src: SourceName; raws: Raw[] }>, notes: string[]): LookupResult {
  const byDomain = new Map<string, Candidate>();
  const loose: Candidate[] = [];
  const answered = new Set<SourceName>();

  const fold = (c: Candidate | undefined, src: SourceName, r: Raw): Candidate => {
    if (!c) return { name: r.name, domain: r.domain, country: r.country, sources: [src], calaId: r.calaId, sourceUrls: [...r.urls], mode: r.mode };
    if (!c.sources.includes(src)) c.sources.push(src);
    c.country ??= r.country;
    c.calaId ??= r.calaId;
    for (const u of r.urls) if (!c.sourceUrls.includes(u)) c.sourceUrls.push(u);
    c.mode = weakest(c.mode, r.mode);
    return c;
  };

  // Domain-bearing sources first so Cala hits can attach to them.
  const ordered = [...bySource].sort((a, b) => Number(a.src === "cala") - Number(b.src === "cala"));
  for (const { src, raws } of ordered) {
    if (raws.length) answered.add(src);
    for (const r of raws) {
      if (r.domain) {
        byDomain.set(r.domain, fold(byDomain.get(r.domain), src, r));
        continue;
      }
      const match = [...byDomain.values()].find((c) => nameSimilarity(c.name, r.name) >= 0.85);
      if (match) { fold(match, src, r); continue; }
      const l = loose.find((c) => nameSimilarity(c.name, r.name) >= 0.85);
      if (l) fold(l, src, r); else loose.push(fold(undefined, src, r));
    }
  }
  return { candidates: [...byDomain.values(), ...loose], answered: [...answered], notes };
}

/** Look up one company by a user-supplied domain (chooser for UNRESOLVED rows). Null if no source knows it. */
export async function lookupByDomain(domain: string, name: string): Promise<Candidate | null> {
  const cd = await source({ provider: "contextdev", op: "company_search", params: { query: name, domain } });
  const raws: Raw[] = cd.ok ? parseContextdev(cd.data, cd.mode).filter((r) => r.domain === domain) : [];
  const cat = catalogByDomain(domain);
  if ((!cd.ok || cd.mode === "SEED") && cat) raws.push({ ...fromCatalog(cat, "contextdev") });
  const r0 = raws[0];
  if (!r0) return null;
  return {
    name: r0.name, domain, country: r0.country, sources: ["contextdev"], calaId: null,
    sourceUrls: [...new Set(raws.flatMap((r) => r.urls))], mode: raws.map((r) => r.mode).reduce(weakest),
  };
}
