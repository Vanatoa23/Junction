import { config } from "../../config";
import type { Provider } from "../types";
import { SEED_COMPANIES } from "../../seed/data";
import { httpJson } from "./http";

/**
 * Exa. POST https://api.exa.ai/search, header `x-api-key`. LIVE only when EXA_API_KEY is set.
 * Plain /search with category "company" (no Websets: paid + async). category=company REJECTS date filters.
 *
 * !! UNVERIFIED !! live() is written from docs/api-findings.md and has never run against the real service.
 *
 * OPS:
 *  search {query, category?: "company", numResults?}   candidate discovery / domain lookup
 *
 * PRIVACY: never put the client's name or supplier list in `query`.
 */
export const exa: Provider = {
  name: "exa",
  hasKey: () => !!config.EXA_API_KEY,
  async live(op, p, signal) {
    if (op !== "search") throw new Error(`exa.${op} unknown op`);
    const data = await httpJson<{ results?: Array<{ url?: string }> }>("https://api.exa.ai/search", {
      signal, headers: { "x-api-key": config.EXA_API_KEY },
      body: { query: String(p.query), category: p.category ?? "company", numResults: Number(p.numResults ?? 5), contents: { highlights: true } },
    });
    return { data, sourceUrls: (data.results ?? []).map((r) => r.url).filter((u): u is string => !!u) };
  },
  async seed(op, params) {
    if (op !== "search") return null;
    const q = String(params.query ?? "").toLowerCase();
    const pool = SEED_COMPANIES.filter((c) => c.pool && (q === "" || q.includes(c.category)));
    if (!pool.length) return null;
    return {
      data: { results: pool.map((c) => ({ title: c.legalName, url: `https://${c.domain}`, entities: [{ name: c.legalName, headquarters: { country: c.country } }] })) },
      sourceUrls: [],
    };
  },
};
