import { config } from "../../config";
import { NotImplementedError, type Provider } from "../types";
import { SEED_COMPANIES } from "../../seed/data";

/**
 * Exa. POST https://api.exa.ai/search, `x-api-key`. Plain /search with category "company"
 * (no Websets: paid + async). category=company REJECTS date filters.
 *
 * OPS:
 *  search {query, category?: "company", numResults?, excludeCountries?}   [Onboarding: find domain for a bare name; Engine: candidate discovery]
 *
 * PRIVACY: never put the client's name or supplier list in `query`.
 */
export const exa: Provider = {
  name: "exa",
  hasKey: () => !!config.EXA_API_KEY,
  async live(op) {
    throw new NotImplementedError(`exa.${op} live call`);
  },
  async seed(op, params) {
    if (op !== "search") return null;
    const wanted = String(params.category_hint ?? params.query ?? "").toLowerCase();
    const pool = SEED_COMPANIES.filter((c) => c.pool && (wanted === "" || wanted.includes(c.category) || String(params.query ?? "").toLowerCase().includes(c.category)));
    if (!pool.length) return null;
    return {
      data: { results: pool.map((c) => ({ title: c.legalName, url: `https://${c.domain}`, entities: [{ name: c.legalName, headquarters: { country: c.country } }] })) },
      sourceUrls: [],
    };
  },
};
