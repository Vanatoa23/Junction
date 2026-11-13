import type { SsePayload } from "@secondsource/shared";
import { publish } from "../bus";
import { enqueue } from "../db/jobs";
import { source } from "../source";

/**
 * Injectable side effects so handlers can run inline (demo script, tests) without the worker or SSE,
 * and so the classifier can be faked to test the quote-drop path.
 */
export interface EngineDeps {
  enqueue: (kind: any, payload: any, opts?: { clientId?: string | null }) => Promise<unknown>;
  publish: (p: SsePayload) => Promise<unknown>;
  classify: (text: string, sourceUrl: string) => ReturnType<typeof source>;
  log: (m: string) => void;
}

export const defaultDeps: EngineDeps = {
  enqueue: (kind, payload, opts) => enqueue(kind, payload, opts),
  publish: (p) => publish(p),
  classify: (text, sourceUrl) => source({ provider: "gemini", op: "classify", params: { text, sourceUrl } }),
  log: (m) => console.log(`[engine ${new Date().toISOString()}] ${m}`),
};
