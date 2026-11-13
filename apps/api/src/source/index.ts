import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProviderName, SourceMode } from "@secondsource/shared";
import { config } from "../config";
import { contextdev } from "./providers/contextdev";
import { exa } from "./providers/exa";
import { cala } from "./providers/cala";
import { gemini } from "./providers/gemini";
import type { Provider, SourceRequest, SourceResult } from "./types";

export * from "./types";

export const providers: Record<ProviderName, Provider> = { contextdev, exa, cala, gemini };

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures/rec");

/** Stable key: provider/op + sha1 of canonical JSON params. */
export function fixturePath(req: Pick<SourceRequest, "provider" | "op" | "params">): string {
  const h = createHash("sha1").update(canonical(req.params)).digest("hex").slice(0, 12);
  return join(FIXTURE_DIR, req.provider, `${req.op}-${h}.json`);
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => `${JSON.stringify(k)}:${canonical(x)}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

/** The mode a provider will use right now (for /health and UI badges): LIVE only if a key exists and SOURCE_MODE=auto; REC if fixtures exist; else SEED. */
export function currentMode(name: ProviderName): SourceMode {
  if (config.SOURCE_MODE === "auto" && providers[name].hasKey()) return "LIVE";
  // No live call possible: REC if any recorded fixture exists for this provider, else the SEED providers answer.
  return config.SOURCE_MODE !== "seed" && existsSync(join(FIXTURE_DIR, name)) ? "REC" : "SEED";
}

/**
 * Order: LIVE (key present, mode auto, not forced) -> REC fixture -> SEED -> ok:false.
 * Never throws. Never invents data: a miss returns ok:false with a note.
 * With SOURCE_RECORD=1 successful LIVE responses are written as REC fixtures
 * (secrets are never in params/data; do not put keys in params).
 */
export async function source<T = unknown>(req: SourceRequest): Promise<SourceResult<T>> {
  const started = Date.now();
  const provider = providers[req.provider];
  const base = { provider: req.provider, op: req.op, fetchedAt: new Date().toISOString() };
  const done = (r: Omit<SourceResult<T>, "provider" | "op" | "fetchedAt" | "latencyMs" | "recordedAt"> & { recordedAt?: string | null }): SourceResult<T> => ({
    ...base, latencyMs: Date.now() - started, recordedAt: null, ...r,
  });
  const mode = req.forceMode ?? (config.SOURCE_MODE === "auto" ? "live" : config.SOURCE_MODE);
  let note: string | null = null;

  if (mode === "live") {
    if (provider.hasKey()) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), req.timeoutMs ?? config.SOURCE_TIMEOUT_MS);
      try {
        const r = await provider.live(req.op, req.params, ctrl.signal);
        if (config.SOURCE_RECORD === "1") record(req, r.data, r.sourceUrls);
        return done({ ok: true, mode: "LIVE", data: r.data as T, note: null, sourceUrls: r.sourceUrls });
      } catch (e) {
        note = `live failed: ${ctrl.signal.aborted ? "timeout" : (e as Error).message}`;
      } finally {
        clearTimeout(timer);
      }
    } else {
      note = "no API key";
    }
  }

  if (mode !== "seed") {
    const p = fixturePath(req);
    if (existsSync(p)) {
      const f = JSON.parse(readFileSync(p, "utf8")) as { data: T; sourceUrls: string[]; recordedAt: string };
      return done({ ok: true, mode: "REC", data: f.data, note: note && `${note}; used recorded response`, sourceUrls: f.sourceUrls, recordedAt: f.recordedAt });
    }
  }

  const s = await provider.seed(req.op, req.params).catch(() => null);
  if (s) return done({ ok: true, mode: "SEED", data: s.data as T, note: note && `${note}; used seed data`, sourceUrls: s.sourceUrls });

  return done({ ok: false, mode: "SEED", data: null, note: `${note ?? "mode " + mode}; no recorded or seed data for ${req.provider}.${req.op}`, sourceUrls: [] });
}

function record(req: SourceRequest, data: unknown, sourceUrls: string[]) {
  const p = fixturePath(req);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ request: { provider: req.provider, op: req.op, params: req.params }, recordedAt: new Date().toISOString(), sourceUrls, data }, null, 2));
}
