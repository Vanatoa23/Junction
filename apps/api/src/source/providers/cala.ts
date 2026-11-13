import { config } from "../../config";
import { NotImplementedError, type Provider } from "../types";
import { findSeed, parentOf } from "./seedLookup";

/**
 * Cala. Base https://api.cala.ai/v1, header `X-API-KEY`.
 *
 * OPS:
 *  entity_search {name, limit?}        GET  /v1/entities?name=&entity_types=Company&limit=   [Onboarding]
 *  ownership     {entityId}            POST /v1/entities/{id} with relationships.outgoing.IS_ULTIMATE_PARENT [Onboarding/Engine]
 *    (edge names must be confirmed via GET /v1/entities/{id}/introspection; coverage of small Nordic firms unknown)
 */
export const cala: Provider = {
  name: "cala",
  hasKey: () => !!config.CALA_API_KEY,
  async live(op) {
    throw new NotImplementedError(`cala.${op} live call`);
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
