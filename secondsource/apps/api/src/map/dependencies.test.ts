import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { config } from "../config";
import { pool } from "../db/pool";
import { runInline } from "../engine/pipeline";
import { buildMap } from "../map";
import { uid, DEMO_TRIGGER_TEXT } from "../seed/data";
import { buildServer } from "../server";

describe("buyer dependency evidence", () => {
  afterAll(() => pool.end());

  it("deduplicates repeating imports by normalized website, including concurrent batches", async () => {
    const app = await buildServer();
    try {
      const batch = { suppliers: [
        { name: "Nordpack Packaging", domain: "https://www.nordpack.example/about" },
        { name: "Nordpack under another name", domain: "nordpack.example" },
      ] };
      const responses = await Promise.all([0, 1].map(() => app.inject({ method: "POST", url: "/suppliers/resolve", payload: batch })));
      for (const response of responses) {
        expect(response.statusCode).toBe(202);
        expect(response.json()).toMatchObject({ duplicates: 2, suppliers: [{ edgeId: uid("edge", 1) }] });
      }
    } finally {
      await app.close();
    }
  });

  it("shows an evidence path for a port disruption and keeps private links scoped to the buyer", async () => {
    const app = await buildServer();
    const clientId = randomUUID();
    const otherEdge = randomUUID();
    const edgeId = uid("edge", 10);
    const url = `/suppliers/${edgeId}/dependencies`;
    const evidence = {
      source: "Supplier confirmation",
      sourceUrl: null,
      confidence: "HIGH",
      verifiedOn: new Date().toISOString().slice(0, 10),
    };
    let eventId: string | undefined;
    let parentId: string | undefined;
    let nestedId: string | undefined;
    let plantId: string | undefined;
    try {
      await pool.query("INSERT INTO client (id, name) VALUES ($1, $2)", [clientId, "Other buyer"]);
      await pool.query(
        "INSERT INTO supplier_edge (id, client_id, company_id, input_name, status) VALUES ($1, $2, $3, $4, 'MONITORED')",
        [otherEdge, clientId, uid("company", 10), "Tallinn Caps"],
      );
      const put = (payload: object) => app.inject({ method: "PUT", url, payload: { ...evidence, ...payload } });
      const parent = await put({ parentId: null, kind: "SUPPLIER", name: "Private Polymer Supplier" });
      expect(parent.statusCode).toBe(200);
      parentId = parent.json().dependencies.find((link: { name: string }) => link.name === "Private Polymer Supplier").id;
      const nested = await put({ parentId, kind: "SUPPLIER", name: "Private Upstream Mill" });
      expect(nested.statusCode).toBe(200);
      nestedId = nested.json().dependencies.find((link: { name: string }) => link.name === "Private Upstream Mill").id;
      const port = await put({ parentId: nestedId, kind: "PORT", name: "Port of Rotterdam", matchKey: "NLRTM" });
      expect(port.statusCode).toBe(200);
      expect(port.json().dependencies).toContainEqual(expect.objectContaining({ ...evidence, parentId: nestedId, matchKey: "NLRTM" }));
      const plant = await put({ parentId: null, kind: "PLANT", name: "Tallinn plant", matchKey: "tallinn-caps-2" });
      expect(plant.statusCode).toBe(200);
      plantId = plant.json().dependencies.find((link: { name: string }) => link.name === "Tallinn plant").id;

      const event = await pool.query("INSERT INTO event (via, source_url, mode, is_test, fetched_text, t_received) VALUES ('POLL','http://localhost:3001/test-notice','LOCAL',true,$1,now()) RETURNING id", [DEMO_TRIGGER_TEXT]);
      eventId = event.rows[0].id;
      await runInline(eventId!, { publish: async () => undefined, log: () => {} });

      const supplier = (await buildMap(config.DEMO_CLIENT_ID)).suppliers.find((item) => item.edgeId === edgeId)!;
      expect(supplier.risk.coverage).toBe("GOOD");
      expect(supplier.exposures).toContainEqual(expect.objectContaining({
        path: [
          expect.objectContaining({ name: "Private Polymer Supplier" }),
          expect.objectContaining({ name: "Private Upstream Mill" }),
          expect.objectContaining({ matchKey: "NLRTM" }),
        ],
      }));
      expect((await buildMap(clientId)).suppliers[0]!.exposures).toEqual([]);
      expect((await app.inject({ method: "GET", url: `/suppliers/${otherEdge}/dependencies` })).statusCode).toBe(404);
      expect((await put({ parentId: nestedId, kind: "PORT", name: "Invalid port", matchKey: "Rotterdam" })).statusCode).toBe(400);
      expect((await app.inject({ method: "DELETE", url: `${url}/${parentId}` })).statusCode).toBe(204);
      const updated = (await buildMap(config.DEMO_CLIENT_ID)).suppliers.find((item) => item.edgeId === edgeId)!;
      expect(updated.risk.coverage).toBe("LIMITED");
      expect(updated.exposures).toEqual([]);
    } finally {
      await pool.query("DELETE FROM supplier_dependency WHERE id = ANY($1)", [[parentId, plantId].filter(Boolean)]);
      if (eventId) {
        const filter = "SELECT id FROM incident WHERE event_id = $1";
        await pool.query(`DELETE FROM job WHERE payload->>'incidentId' IN (SELECT id::text FROM incident WHERE event_id = $1)`, [eventId]);
        await pool.query(`DELETE FROM check_result WHERE candidate_id IN (SELECT id FROM candidate WHERE incident_id IN (${filter}))`, [eventId]);
        await pool.query(`DELETE FROM candidate WHERE incident_id IN (${filter})`, [eventId]);
        await pool.query(`DELETE FROM alert WHERE incident_id IN (${filter})`, [eventId]);
        await pool.query("DELETE FROM incident WHERE event_id = $1", [eventId]);
        await pool.query("DELETE FROM event WHERE id = $1", [eventId]);
      }
      await pool.query("DELETE FROM supplier_edge WHERE id = $1", [otherEdge]);
      await pool.query("DELETE FROM client WHERE id = $1", [clientId]);
      await app.close();
    }
  });
});
