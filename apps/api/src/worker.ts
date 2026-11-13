import { JobPayloads, type JobKind } from "@secondsource/shared";
import { config } from "./config";
import { claimJob, completeJob, failJob, requeueStale } from "./db/jobs";
import { pool } from "./db/pool";
import type { JobHandler, JobHandlers } from "./module";
import { modules } from "./modules";

/**
 * Worker process: polls the job table, runs handlers from the owned modules.
 * Separate process from the API (run: pnpm --filter @secondsource/api worker).
 * A job kind with no registered handler is failed immediately (not retried) with a clear message.
 */
const handlers = new Map<JobKind, JobHandler<any>>();
for (const m of modules) {
  for (const [kind, fn] of Object.entries(m.jobHandlers ?? {} as JobHandlers)) {
    if (handlers.has(kind as JobKind)) throw new Error(`job kind ${kind} has two handlers (module ${m.name})`);
    handlers.set(kind as JobKind, fn as JobHandler<any>);
  }
}

const log = (m: string) => console.log(`[worker ${new Date().toISOString()}] ${m}`);
let stopping = false;
process.on("SIGINT", () => (stopping = true));
process.on("SIGTERM", () => (stopping = true));

async function tick(): Promise<boolean> {
  const job = await claimJob();
  if (!job) return false;
  const fn = handlers.get(job.kind);
  if (!fn) {
    await failJob({ ...job, attempts: job.max_attempts }, new Error(`no handler registered for job kind "${job.kind}"`));
    log(`job ${job.id} ${job.kind}: no handler`);
    return true;
  }
  try {
    await fn(JobPayloads[job.kind].parse(job.payload), job);
    await completeJob(job.id);
    log(`job ${job.id} ${job.kind}: done`);
  } catch (e) {
    await failJob(job, e);
    log(`job ${job.id} ${job.kind}: failed (attempt ${job.attempts}/${job.max_attempts}): ${(e as Error).message}`);
  }
  return true;
}

log(`started; handlers: ${[...handlers.keys()].join(", ") || "(none yet)"}`);
for (const m of modules) await m.startWorker?.();

let lastStale = 0;
while (!stopping) {
  try {
    if (Date.now() - lastStale > 60_000) {
      lastStale = Date.now();
      const n = await requeueStale();
      if (n) log(`requeued ${n} stale job(s)`);
    }
    const worked = await tick();
    if (!worked) await new Promise((r) => setTimeout(r, config.WORKER_POLL_MS));
  } catch (e) {
    log(`loop error: ${(e as Error).message}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
await pool.end();
