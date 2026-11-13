import { config } from "../config";
import { pool } from "../db/pool";
import { enqueue } from "../db/jobs";
import { source } from "../source";
import { hashText, lineDiff, normalise, parseLastUpdated } from "./diff";
import { ingestChange } from "./ingest";

/**
 * Poll path (the DEFAULT live path; UI says "poll"). Keyless: source({provider:"local", op:"scrape"}) -> mode LOCAL.
 * With a key, swap `provider` to "contextdev" (maxAgeMs:0) at the ONE call site in pollOnce; the scrape result
 * shape differs (markdown vs text), so adapt `text` there. UNVERIFIED until a key exists.
 * Interval: INGEST_POLL_INTERVAL_MS (default 10 s in dev, 45 s when NODE_ENV=production).
 */
export const POLL_INTERVAL_MS = Number(process.env.INGEST_POLL_INTERVAL_MS ?? (process.env.NODE_ENV === "production" ? 45_000 : 10_000));
export const testNoticeUrl = () => `${config.PUBLIC_BASE_URL}/test-notice`;

export type PollOutcome = { status: "baseline" | "unchanged" | "changed" | "error"; eventId?: string; note?: string };

export async function pollOnce(url: string, isTest = true): Promise<PollOutcome> {
  const res = await source<{ text: string; html: string }>({ provider: "local", op: "scrape", params: { url } });
  const tReceived = new Date();
  if (!res.ok || !res.data) return { status: "error", note: res.note ?? "scrape failed" };
  const rawText = res.data.text;
  const text = normalise(rawText);
  const hash = hashText(text);
  const prev = (await pool.query(`SELECT content_hash, text FROM watch_snapshot WHERE url=$1`, [url])).rows[0];
  if (!prev) {
    await pool.query(`INSERT INTO watch_snapshot (url, content_hash, text) VALUES ($1,$2,$3) ON CONFLICT (url) DO NOTHING`, [url, hash, text]);
    return { status: "baseline" };
  }
  if (prev.content_hash === hash) {
    await pool.query(`UPDATE watch_snapshot SET last_polled_at=now() WHERE url=$1`, [url]);
    return { status: "unchanged" };
  }
  const diff = lineDiff(prev.text, text);
  const ing = await ingestChange({
    via: "POLL", sourceUrl: url, mode: res.mode, isTest, fetchedText: rawText, contentHash: hash,
    tSource: (() => { const t = parseLastUpdated(rawText); return t ? new Date(t) : null; })(), tReceived,
    raw: { diff, scrapeLatencyMs: res.latencyMs, provider: res.provider, note: "scrape-and-diff poll" },
  });
  await pool.query(`UPDATE watch_snapshot SET content_hash=$2, text=$3, last_polled_at=now(), last_changed_at=now() WHERE url=$1`, [url, hash, text]);
  return { status: "changed", eventId: ing?.event.id };
}

/** Enqueue a poll_page job unless one is already queued/running for this URL. */
export async function enqueuePoll(url: string, label = "TEST notice"): Promise<number | null> {
  const dup = await pool.query(`SELECT 1 FROM job WHERE kind='poll_page' AND status IN ('queued','running') AND payload->>'url'=$1 LIMIT 1`, [url]);
  if (dup.rowCount) return null;
  return enqueue("poll_page", { url, label });
}

/** Worker loop: one poll job per interval for the TEST page. The first tick stores the baseline. */
export function startPollScheduler(log: (m: string) => void = console.log) {
  const tick = () => enqueuePoll(testNoticeUrl()).catch((e) => log(`[ingest] poll schedule failed: ${e.message}`));
  log(`[ingest] poll scheduler: every ${POLL_INTERVAL_MS / 1000}s on ${testNoticeUrl()} (LOCAL poll)`);
  tick();
  setInterval(tick, POLL_INTERVAL_MS).unref();
}
