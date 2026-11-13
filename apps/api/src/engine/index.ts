import type { ModuleDef } from "../module";
import { findAlternatives } from "./alternatives";
import { classifyEvent } from "./classify";
import { matchIncident } from "./match";
import { registerEngineRoutes } from "./routes";

/**
 * OWNER: Engine thread. See README.md in this folder.
 * Jobs: classify_event -> match_incident -> find_alternatives. Routes: /alerts, /incidents*, /candidates/:id/approve.
 */
const mod: ModuleDef = {
  name: "engine",
  registerRoutes: registerEngineRoutes,
  jobHandlers: {
    classify_event: async ({ eventId }) => void (await classifyEvent(eventId)),
    match_incident: async ({ incidentId }) => void (await matchIncident(incidentId)),
    find_alternatives: async (p) => void (await findAlternatives(p)),
  },
};
export default mod;
