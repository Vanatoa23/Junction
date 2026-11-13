import type pg from "pg";
import { JobPayloads, type JobKind, type JobPayload } from "@secondsource/shared";
import { pool, type Queryable } from "./pool";

/**
 * Postgres job queue. CONTRACT:
 *  - enqueue() validates the payload against packages/shared/src/jobs.ts.
 *  - claimJob() uses FOR UPDATE SKIP LOCKED, so any number of workers are safe.
 *  - Failures retry with exponential backoff until max_attempts, then status=failed.
 *  - Jobs left 'running' by a crashed worker are re-queued after STALE_MS.
 */
export interface JobRow {
  id: number;
  client_id: string | null;
  kind: JobKind;
  payload: unknown;
  attempts: number;
  max_attempts: number;
}

const STALE_MS = 5 * 60_000;

export async function enqueue<K extends JobKind>(
  kind: K,
  payload: JobPayload<K>,
  opts: { clientId?: string | null; delayMs?: number; maxAttempts?: number; db?: Queryable } = {},
): Promise<number> {
  const parsed = JobPayloads[kind].parse(payload);
  const db = opts.db ?? pool;
  const r = await db.query(
    `INSERT INTO job (client_id, kind, payload, run_after, max_attempts)
     VALUES ($1, $2, $3, now() + ($4 || ' milliseconds')::interval, $5) RETURNING id`,
    [opts.clientId ?? null, kind, JSON.stringify(parsed), String(opts.delayMs ?? 0), opts.maxAttempts ?? 3],
  );
  return r.rows[0].id as number;
}

/** Atomically claim the next runnable job, or null. */
export async function claimJob(db: Queryable = pool): Promise<JobRow | null> {
  const r = await db.query(
    `UPDATE job SET status = 'running', locked_at = now(), attempts = attempts + 1
     WHERE id = (
       SELECT id FROM job
       WHERE status = 'queued' AND run_after <= now()
       ORDER BY run_after, id
       FOR UPDATE SKIP LOCKED
       LIMIT 1)
     RETURNING id, client_id, kind, payload, attempts, max_attempts`,
  );
  return (r.rows[0] as JobRow | undefined) ?? null;
}

export async function completeJob(id: number, db: Queryable = pool) {
  await db.query(`UPDATE job SET status = 'done', finished_at = now(), locked_at = NULL WHERE id = $1`, [id]);
}

export async function failJob(job: Pick<JobRow, "id" | "attempts" | "max_attempts">, err: unknown, db: Queryable = pool) {
  const msg = err instanceof Error ? err.message : String(err);
  if (job.attempts >= job.max_attempts) {
    await db.query(`UPDATE job SET status = 'failed', last_error = $2, finished_at = now(), locked_at = NULL WHERE id = $1`, [job.id, msg]);
  } else {
    const backoffMs = 2000 * 2 ** (job.attempts - 1);
    await db.query(
      `UPDATE job SET status = 'queued', last_error = $2, locked_at = NULL,
         run_after = now() + ($3 || ' milliseconds')::interval WHERE id = $1`,
      [job.id, msg, String(backoffMs)],
    );
  }
}

export async function requeueStale(db: Queryable = pool): Promise<number> {
  const r = await db.query(
    `UPDATE job SET status = 'queued', locked_at = NULL
     WHERE status = 'running' AND locked_at < now() - ($1 || ' milliseconds')::interval`,
    [String(STALE_MS)],
  );
  return r.rowCount ?? 0;
}

export type { pg };
