import { ListEventsResponse } from "@secondsource/shared";
import type { ModuleDef } from "../module";
import { listEvents } from "./ingest";
import { pollOnce, POLL_INTERVAL_MS, startPollScheduler, testNoticeUrl } from "./poll";
import { registerTestNotice } from "./testNotice";
import { registerWebhook } from "./webhook";

/**
 * OWNER: Ingest thread. See README.md.
 * Default live path = scrape-and-diff POLL (LOCAL without keys; UI says "poll"). Webhook = second path.
 * Both call ingestChange() (ingest.ts): writes the event, publishes event.received, enqueues classify_event.
 */
const mod: ModuleDef = {
  name: "ingest",
  async registerRoutes(app) {
    registerTestNotice(app);
    await registerWebhook(app);
    app.get<{ Querystring: { limit?: string } }>("/events", async (req) => {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50) || 50));
      return ListEventsResponse.parse({ events: await listEvents(limit) });
    });
    // Dev: poll the TEST page right now and report the outcome.
    app.post("/dev/poll-now", async () => ({ intervalMs: POLL_INTERVAL_MS, via: "POLL", ...(await pollOnce(testNoticeUrl())) }));
  },
  jobHandlers: {
    async poll_page({ url }) {
      const r = await pollOnce(url);
      if (r.status === "error") throw new Error(r.note);
    },
  },
  startWorker() {
    startPollScheduler();
  },
};
export default mod;
