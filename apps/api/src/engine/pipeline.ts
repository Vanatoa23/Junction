import { findAlternatives } from "./alternatives";
import { classifyEvent } from "./classify";
import { defaultDeps, type EngineDeps } from "./deps";
import { matchIncident } from "./match";

/**
 * Run classify -> match -> alternatives INLINE in this process (no worker, follow-up jobs are executed here
 * instead of being queued). Used by the demo script and tests so they never race a running worker.
 * The real path is the worker running the same functions via engine/index.ts jobHandlers.
 */
export async function runInline(eventId: string, overrides: Partial<EngineDeps> = {}) {
  const queue: Array<{ kind: string; payload: any }> = [];
  const deps: EngineDeps = { ...defaultDeps, ...overrides, enqueue: async (kind, payload) => void queue.push({ kind, payload }) };
  const classified = await classifyEvent(eventId, deps);
  while (queue.length) {
    const j = queue.shift()!;
    if (j.kind === "match_incident") await matchIncident(j.payload.incidentId, deps);
    else if (j.kind === "find_alternatives") await findAlternatives(j.payload, deps);
  }
  return classified;
}
