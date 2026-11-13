import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config";
import { hashText } from "./diff";
import { ingestChange } from "./ingest";
import { verifySignature } from "./signature";

/**
 * POST /webhooks/contextdev. UNVERIFIED against the real service (no key): tested with a self-signed fixture.
 * The raw body is captured by a content-type parser scoped to this plugin only. Answers 202 fast.
 */
const Envelope = z.object({
  event: z.string(),
  id: z.string(),
  created_at: z.string().optional(),
  data: z.object({ change: z.record(z.unknown()).nullish() }).passthrough().optional(),
});

const str = (v: unknown) => (typeof v === "string" ? v : null);

export async function registerWebhook(app: FastifyInstance, secret: () => string = () => config.CONTEXT_DEV_WEBHOOK_SECRET) {
  await app.register(async (scope) => {
    scope.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));
    scope.post("/webhooks/contextdev", async (req, reply) => {
      const key = secret();
      if (!key) return reply.code(503).send({ error: "webhook_not_configured", detail: "CONTEXT_DEV_WEBHOOK_SECRET is empty (keyless mode)" });
      const rawBody = req.body as Buffer;
      const sig = verifySignature(key, req.headers["x-context-signature"] as string | undefined, rawBody);
      if (!sig.ok) return reply.code(401).send({ error: "bad_signature", reason: sig.reason });
      const tReceived = new Date();
      let json: unknown;
      try { json = JSON.parse(rawBody.toString("utf8")); } catch { return reply.code(400).send({ error: "bad_json" }); }
      const env = Envelope.safeParse(json);
      if (!env.success) return reply.code(400).send({ error: "bad_envelope" });
      const contextId = (req.headers["x-context-id"] as string | undefined) ?? env.data.id;
      if (env.data.event !== "change.detected" || !env.data.data?.change) return reply.code(202).send({ received: true, eventId: null });
      const ch = env.data.data.change;
      const url = str(ch.url);
      if (!url) return reply.code(400).send({ error: "no_url_in_change" });
      // Text the quote check runs on: the after-excerpt if present, else the summary. Payload shape is DOCUMENTED, not seen.
      const text = str(ch.after_text_excerpt) ?? str(ch.summary) ?? "";
      const detected = str(ch.detected_at) ? new Date(str(ch.detected_at)!) : null;
      const res = await ingestChange({
        via: "WEBHOOK", sourceUrl: url, mode: "LIVE", fetchedText: text, contentHash: hashText(text),
        raw: { payload: json, unverified: true }, contextId, monitorRef: str(ch.monitor_id),
        isTest: new URL(url).origin === new URL(config.PUBLIC_BASE_URL).origin,
        tSource: detected && !isNaN(detected.getTime()) ? detected : null, tReceived,
      });
      return reply.code(202).send({ received: true, eventId: res?.event.id ?? null });
    });
  });
}
