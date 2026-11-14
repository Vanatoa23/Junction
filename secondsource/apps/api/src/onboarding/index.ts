import { ChooseSupplierRequest, ResolveSuppliersRequest } from "@secondsource/shared";
import { config } from "../config";
import { loadMergedSuppliers, loadSuppliers } from "../db/mappers";
import type { ModuleDef } from "../module";
import { ChooseError, chooseSupplier, importSuppliers, extractFootprint, resolveSupplier } from "./pipeline";

/**
 * OWNER: Onboarding thread. See README.md in this folder.
 *
 *  POST /suppliers/resolve       202  creates PENDING rows, queues resolve_supplier per row
 *  POST /suppliers/:edgeId/choose     pick an option (companyId) or supply a domain for AMBIGUOUS / UNRESOLVED rows
 *  GET  /suppliers, /suppliers/:edgeId
 *  jobs: resolve_supplier, extract_footprint
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mod: ModuleDef = {
  name: "onboarding",
  registerRoutes(app) {
    app.get("/suppliers", async () => {
      const [suppliers, merged] = await Promise.all([loadSuppliers(config.DEMO_CLIENT_ID), loadMergedSuppliers(config.DEMO_CLIENT_ID)]);
      return { suppliers, merged };
    });

    app.get<{ Params: { edgeId: string } }>("/suppliers/:edgeId", async (req, reply) => {
      if (!UUID.test(req.params.edgeId)) return reply.code(400).send({ error: "bad_id" });
      const [supplier] = await loadSuppliers(config.DEMO_CLIENT_ID, req.params.edgeId);
      return supplier ? { supplier } : reply.code(404).send({ error: "not_found" });
    });

    app.post("/suppliers/resolve", async (req, reply) => {
      const parsed = ResolveSuppliersRequest.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "bad_request", detail: parsed.error.flatten() });
      const { suppliers, duplicates } = await importSuppliers(config.DEMO_CLIENT_ID, parsed.data.suppliers);
      if (!suppliers.length) return reply.code(400).send({ error: "Enter at least one supplier name." });
      return reply.code(202).send({ suppliers, duplicates });
    });

    app.post<{ Params: { edgeId: string } }>("/suppliers/:edgeId/choose", async (req, reply) => {
      if (!UUID.test(req.params.edgeId)) return reply.code(400).send({ error: "bad_id" });
      const parsed = ChooseSupplierRequest.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "bad_request", detail: parsed.error.flatten() });
      try {
        await chooseSupplier(config.DEMO_CLIENT_ID, req.params.edgeId, parsed.data);
      } catch (e) {
        if (e instanceof ChooseError) return reply.code(e.status).send({ error: e.message });
        throw e;
      }
      const merged = await loadMergedSuppliers(config.DEMO_CLIENT_ID);
      const [supplier] = await loadSuppliers(config.DEMO_CLIENT_ID, merged[req.params.edgeId] ?? req.params.edgeId);
      return { supplier };
    });
  },
  jobHandlers: {
    resolve_supplier: async ({ edgeId }) => resolveSupplier(edgeId),
    extract_footprint: async ({ companyId, edgeId }) => extractFootprint(companyId, edgeId),
  },
};
export default mod;
