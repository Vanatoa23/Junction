import { config } from "../../config";
import { NotImplementedError, type Provider } from "../types";
import { findSeed } from "./seedLookup";

/**
 * Context.dev. Base https://api.context.dev/v1, `Authorization: Bearer <key>`.
 * Facts and caveats: docs/api-findings.md (all DOCUMENTED, none VERIFIED-LIVE yet).
 *
 * OPS (owner in brackets; live() bodies are STUBS until that thread builds them):
 *  company_search {query, countries?}       POST /company/search            [Onboarding]
 *  scrape         {url}                      POST /web/scrape, maxAgeMs:0    [Ingest]  (the poll path: "poll" in the UI)
 *  news_search    {name, domain?, ...}       POST /news/search               [Engine, live news check]
 *  monitor_create {url, webhookUrl}          POST /monitors (min interval 10 min; webhook secret whsec_...) [Ingest]
 */
export const contextdev: Provider = {
  name: "contextdev",
  hasKey: () => !!config.CONTEXT_DEV_API_KEY,
  async live(op) {
    throw new NotImplementedError(`contextdev.${op} live call`);
  },
  async seed(op, params) {
    if (op === "company_search") {
      const hits = findSeed(params.query as string | undefined, params.domain as string | undefined);
      if (!hits.length) return null;
      return {
        data: {
          results: hits.map((h) => ({
            name: h.legalName, domain: h.domain, headquarters: { country_code: h.country }, description: `SEEDED fictional company (${h.category})`,
          })),
        },
        sourceUrls: [],
      };
    }
    return null; // scrape / news_search / monitor_create have no seed
  },
};
