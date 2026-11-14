import type { FastifyInstance } from "fastify";
import type { JobKind, JobPayload } from "@secondsource/shared";
import type { JobRow } from "./db/jobs";

/**
 * CONTRACT between the app shell and the owned modules.
 * Each of apps/api/src/{ingest,onboarding,engine}/index.ts default-exports a
 * ModuleDef. The API server calls registerRoutes(app); the worker merges
 * jobHandlers. Owners add routes/handlers ONLY inside their own folder.
 */
export type JobHandler<K extends JobKind> = (payload: JobPayload<K>, job: JobRow) => Promise<void>;
export type JobHandlers = { [K in JobKind]?: JobHandler<K> };

export interface ModuleDef {
  name: string;
  registerRoutes?(app: FastifyInstance): void | Promise<void>;
  jobHandlers?: JobHandlers;
  /** Optional: long-lived worker loops (e.g. Ingest's poll scheduler). Called once when the worker starts. */
  startWorker?(): void | Promise<void>;
}

/** Stub helper: respond 501 naming the owner, so the UI/other threads see a clear error. */
export const notImplemented = (owner: string) => async (_req: unknown, reply: { code(n: number): { send(b: unknown): unknown } }) =>
  reply.code(501).send({ error: "not_implemented", detail: `owned by the ${owner} thread` });
