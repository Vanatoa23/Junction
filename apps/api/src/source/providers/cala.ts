import { config } from "../../config";
import type { Provider } from "../types";
import { httpJson } from "./http";
import { findSeed, parentOf } from "./seedLookup";

/**
 * Cala. Base https://api.cala.ai/v1, header `X-API-KEY`. LIVE only when CALA_API_KEY is set.
 *
 * !! UNVERIFIED !! live() is written from docs/api-findings.md and has never run against the real service.
 * Relationship edge names (IS_ULTIMATE_PARENT) must be confirmed via GET /v1/entities/{id}/introspection.
 *
 * OPS:
 *  entity_search {name, limit?}   GET  /v1/entities?name=&entity_types=Company&limit=
 *  ownership     {entityId}       POST /v1/entities/{id} (relationships.outgoing.IS_ULTIMATE_PARENT)
 */
const BASE = "https://api.cala.ai/v1";
const hdr = () => ({ "x-api-key": config.CALA_API_KEY });

export const cala: Provider = {
  name: "cala",
  hasKey: () => !!config.CALA_API_KEY,
  async live(op, p, signal) {
    if (op === "entity_search") {
      const qs = new URLSearchParams({ name: String(p.name), entity_types: "Company", limit: String(p.limit ?? 5) });
      const data = await httpJson(`${BASE}/entities?${qs}`, { signal, headers: hdr() });
      return { data, sourceUrls: [] };
    }
    if (op === "ownership") {
      const data = await httpJson(`${BASE}/entities/${encodeURIComponent(String(p.entityId))}`, {
        signal, headers: hdr(),
        body: { properties: ["name"], relationships: { outgoing: { IS_ULTIMATE_PARENT: { limit: 10 } } } },
      });
      return { data, sourceUrls: [] };
    }
    throw new Error(`cala.${op} unknown op`);
  },
  async seed(op, params) {
    if (op === "entity_search") {
      const hits = findSeed(params.name as string | undefined);
      if (!hits.length) return null;
      return { data: { entities: hits.map((h) => ({ id: `seed:${h.domain}`, name: h.legalName, entity_type: "Company", description: "SEEDED" })) }, sourceUrls: [] };
    }
    if (op === "ownership") {
      const domain = String(params.entityId ?? "").replace(/^seed:/, "");
      const c = findSeed(undefined, domain)[0];
      if (!c) return null;
      const parent = parentOf(c);
      // "?" parent == no ownership data: return an empty result, never a guess.
      return { data: { entityId: params.entityId, ultimateParent: parent && parent !== "?" ? parent : null }, sourceUrls: [] };
    }
    return null;
  },
};
