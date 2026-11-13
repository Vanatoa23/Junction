import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import Fastify from "fastify";
import { SSE_EVENT_TYPES, type HealthResponse, type ProviderName } from "@secondsource/shared";
import { addSseClient, startHub } from "./bus";
import { config } from "./config";
import { pool } from "./db/pool";
import { migrate } from "./db/migrate";
import { modules } from "./modules";
import { currentMode, providers } from "./source";

export async function buildServer() {
  const app = Fastify({ logger: { level: "info", transport: undefined } });
  await app.register(cors, { origin: [config.WEB_ORIGIN, /^http:\/\/localhost:\d+$/], methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });
  await app.register(formbody);

  app.get("/health", async (): Promise<HealthResponse> => {
    const db = await pool.query("SELECT 1").then(() => true, () => false);
    const names = Object.keys(providers) as ProviderName[];
    return {
      ok: db,
      db,
      providers: Object.fromEntries(names.map((n) => [n, { hasKey: providers[n].hasKey(), mode: currentMode(n) }])) as HealthResponse["providers"],
      publicBaseUrl: config.PUBLIC_BASE_URL,
      testNoticeUrl: `${config.PUBLIC_BASE_URL}/test-notice`,
    };
  });

  // SSE. Contract: packages/shared/src/sse.ts
  app.get("/stream", (req, reply) => {
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      "access-control-allow-origin": req.headers.origin ?? "*",
    });
    res.write(`retry: 2000\n: connected; events: ${SSE_EVENT_TYPES.join(",")}\n\n`);
    addSseClient(res);
  });

  for (const m of modules) await m.registerRoutes?.(app);
  return app;
}

if (process.argv[1]?.endsWith("server.ts")) {
  const app = await buildServer();
  // Dev convenience: keep schema current even if the API starts before `pnpm db:migrate`.
  await migrate((m) => app.log.info(m));
  await startHub((m) => app.log.warn(m));
  await app.listen({ port: config.API_PORT, host: config.API_HOST });
}
