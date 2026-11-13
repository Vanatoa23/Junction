import { notImplemented, type ModuleDef } from "../module";

/**
 * OWNER: Engine thread (with packages/checks). See README.md in this folder.
 * Foundation scaffold: all routes 501.
 */
const mod: ModuleDef = {
  name: "engine",
  registerRoutes(app) {
    app.get("/alerts", notImplemented("Engine"));
    app.get("/incidents/:id", notImplemented("Engine"));
    app.get("/incidents/:id/alternatives", notImplemented("Engine"));
    app.post("/candidates/:id/approve", notImplemented("Engine"));
  },
  jobHandlers: {
    // classify_event, match_incident, find_alternatives
  },
};
export default mod;
