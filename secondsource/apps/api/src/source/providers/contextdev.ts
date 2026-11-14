import { config } from "../../config";
import type { Provider } from "../types";
import { httpJson } from "./http";
import { findSeed } from "./seedLookup";

/**
 * Context.dev. Base https://api.context.dev/v1, `Authorization: Bearer <key>`.
 * LIVE is enabled ONLY when CONTEXT_DEV_API_KEY is set.
 *
 * !! UNVERIFIED !! The live() bodies are written against docs/api-findings.md (documentation only).
 * They have NEVER been run against the real service. On the first live call check field names,
 * then run with SOURCE_RECORD=1 to save fixtures.
 *
 * OPS:
 *  company_search {query, countries?}       POST /company/search
 *  scrape         {url}                      POST /web/scrape (maxAgeMs:0 = fresh)
 *  news_search    {name, domain?, limit?}    POST /news/search
 *  monitor_create {url, webhookUrl, name?}   POST /monitors (min interval 10 min; returns webhook secret whsec_..., never log it)
 *
 * Keyless alternative for watching OUR TEST page: provider "local", op "scrape" (mode LOCAL).
 */
const BASE = "https://api.context.dev/v1";
const auth = () => ({ authorization: `Bearer ${config.CONTEXT_DEV_API_KEY}` });

export const contextdev: Provider = {
  name: "contextdev",
  hasKey: () => !!config.CONTEXT_DEV_API_KEY,
  async live(op, p, signal) {
    switch (op) {
      case "company_search": {
        const data = await httpJson<{ results?: Array<{ domain?: string }> }>(`${BASE}/company/search`, {
          signal, headers: auth(),
          body: { query: String(p.query), mode: "fast", ...(p.countries ? { filters: { countries: p.countries } } : {}) },
        });
        return { data, sourceUrls: (data.results ?? []).filter((r) => r.domain).map((r) => `https://${r.domain}`) };
      }
      case "scrape": {
        const data = await httpJson(`${BASE}/web/scrape`, { signal, headers: auth(), body: { url: String(p.url), formats: { markdown: true }, maxAgeMs: 0 } });
        return { data, sourceUrls: [String(p.url)] };
      }
      case "news_search": {
        const data = await httpJson<{ data?: Array<{ url?: string }> }>(`${BASE}/news/search`, {
          signal, headers: auth(),
          body: { searchBy: { type: "entity", entity: { name: String(p.name), ...(p.domain ? { domain: String(p.domain) } : {}) } }, sortBy: { type: "newest" }, limit: Number(p.limit ?? 10) },
        });
        return { data, sourceUrls: (data.data ?? []).map((a) => a.url).filter((u): u is string => !!u) };
      }
      case "monitor_create": {
        const data = await httpJson(`${BASE}/monitors`, {
          signal, headers: auth(),
          body: {
            name: String(p.name ?? "secondsource"),
            target: { type: "page", url: String(p.url) },
            change_detection: "exact",
            schedule: { type: "interval", frequency: 10, unit: "minutes" },
            webhook: { url: String(p.webhookUrl), retry: {} },
            tags: ["secondsource"],
          },
        });
        return { data, sourceUrls: [String(p.url)] };
      }
      default:
        throw new Error(`contextdev.${op} unknown op`);
    }
  },
  async seed(op, params) {
    if (op === "company_search") {
      const hits = findSeed(params.query as string | undefined, params.domain as string | undefined);
      if (!hits.length) return null;
      return {
        data: { results: hits.map((h) => ({ name: h.legalName, domain: h.domain, headquarters: { country_code: h.country }, description: `SEEDED fictional company (${h.category})` })) },
        sourceUrls: [],
      };
    }
    return null; // scrape / news_search / monitor_create have no seed (use provider "local" for the TEST page)
  },
};
