import { notImplemented, type ModuleDef } from "../module";
import { registerTestNotice } from "./testNotice";

/**
 * OWNER: Ingest thread. See README.md in this folder.
 * Foundation scaffold: the TEST notice page works; webhook/events are 501.
 *
 * Plan decision (docs/api-findings.md): Context.dev monitors have a 10 min minimum interval, so the DEFAULT
 * live path is a scrape-and-diff POLL (UI says "poll"). The webhook receiver is the second path. Both MUST call
 * one shared ingestChange() function that writes the event row and enqueues classify_event.
 */
const mod: ModuleDef = {
  name: "ingest",
  registerRoutes(app) {
    registerTestNotice(app);
    app.post("/webhooks/contextdev", notImplemented("Ingest"));
    app.get("/events", notImplemented("Ingest"));
  },
  jobHandlers: {
    // arm_monitors, poll_page
  },
};
export default mod;
