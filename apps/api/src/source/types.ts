import type { ProviderName, SourceMode } from "@secondsource/shared";

/**
 * CONTRACT: the source() adapter. EVERY call to Context.dev, Exa, Cala or
 * Gemini goes through source(). Nothing else in the codebase may use fetch()
 * against those vendors. (Our own TEST page may be scraped via contextdev.)
 *
 * Honesty rule: `mode` on the result is the truth about where `data` came from.
 *   LIVE = a real vendor call made just now
 *   REC  = a recorded real vendor response from apps/api/fixtures/rec (recordedAt set)
 *   SEED = hand-made / deterministic data from seed providers, including the rule-based classifier (labelled in the UI)
 *   LOCAL = our own code against our own host (local provider); not vendor data
 * Callers MUST persist `mode` next to the data and the UI MUST show it.
 */
export interface SourceRequest {
  provider: ProviderName;
  /** Operation name, see the ops table in each provider file (e.g. contextdev: company_search | scrape | news_search | monitor_create). */
  op: string;
  /** JSON-serialisable params. Part of the REC fixture key, so keep them stable/minimal. */
  params: Record<string, unknown>;
  timeoutMs?: number;
  /** Force a mode for this call (tests / "replay" button). Default: config.SOURCE_MODE. */
  forceMode?: "rec" | "seed";
}

export interface SourceResult<T = unknown> {
  ok: boolean;
  mode: SourceMode;
  provider: ProviderName;
  op: string;
  data: T | null;
  /** Human-readable, no secrets. Present when ok=false, or when a fallback happened ("live failed: timeout; used REC"). */
  note: string | null;
  /** URLs the data came from (for the "every real fact shows its source URL" rule). */
  sourceUrls: string[];
  latencyMs: number;
  fetchedAt: string;
  /** REC only: when the real response was originally recorded. */
  recordedAt: string | null;
}

/** What a provider returns from live(); the adapter wraps it. */
export interface LiveResponse<T = unknown> {
  data: T;
  sourceUrls: string[];
}

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} not implemented yet`);
  }
}

export interface Provider {
  name: ProviderName;
  /** Mode reported for a successful live() call. Default LIVE; the local provider reports LOCAL. */
  liveMode?: SourceMode;
  /** True for in-process providers that need no key and no external service (local). */
  alwaysLive?: boolean;
  /** True if a key is configured; without it LIVE is never attempted. */
  hasKey(): boolean;
  /** Real call. Must honour `signal`. Throw on failure; throw NotImplementedError for ops that are stubs. */
  live(op: string, params: Record<string, unknown>, signal: AbortSignal): Promise<LiveResponse>;
  /** Hand-made data for the demo; return null if there is nothing for this request. */
  seed(op: string, params: Record<string, unknown>): Promise<LiveResponse | null>;
}
