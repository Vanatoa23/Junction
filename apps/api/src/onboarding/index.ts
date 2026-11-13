import { config } from "../config";
import { loadSuppliers } from "../db/mappers";
import { notImplemented, type ModuleDef } from "../module";

/**
 * OWNER: Onboarding thread. See README.md in this folder.
 * Foundation scaffold: GET /suppliers works (reads seeded + resolved rows). The rest is 501.
 */
const mod: ModuleDef = {
  name: "onboarding",
  registerRoutes(app) {
    app.get("/suppliers", async () => ({ suppliers: await loadSuppliers(config.DEMO_CLIENT_ID) }));
    app.get<{ Params: { edgeId: string } }>("/suppliers/:edgeId", async (req, reply) => {
      const [supplier] = await loadSuppliers(config.DEMO_CLIENT_ID, req.params.edgeId);
      return supplier ? { supplier } : reply.code(404).send({ error: "not_found" });
    });
    app.post("/suppliers/resolve", notImplemented("Onboarding"));
    app.post("/suppliers/:edgeId/choose", notImplemented("Onboarding"));
  },
  jobHandlers: {
    // resolve_supplier: async ({ edgeId }) => {...},
    // extract_footprint: async ({ companyId, edgeId }) => {...},
  },
};
export default mod;
