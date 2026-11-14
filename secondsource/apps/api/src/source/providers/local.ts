import { config } from "../../config";
import type { Provider } from "../types";

/**
 * "local" provider: in-process operations that need no vendor and no key. Reports mode LOCAL.
 * NEVER label its output as Context.dev. UI says LOCAL (and "poll" for the change flow).
 *
 * OPS:
 *  scrape {url}  GET the page over HTTP and return its visible text. ONLY our own host is allowed
 *                (PUBLIC_BASE_URL origin, or localhost/127.0.0.1): this is the keyless stand-in for
 *                contextdev.scrape, used to watch the TEST notice page.
 *                -> {url, status, fetchedAt, html, text}   (text = <main id="notice"> content if present, else body)
 */
const allowedOrigins = () => new Set([new URL(config.PUBLIC_BASE_URL).origin, `http://localhost:${config.API_PORT}`, `http://127.0.0.1:${config.API_PORT}`]);

export function htmlToText(html: string): string {
  const main = html.match(/<main[^>]*id="notice"[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "");
  return main
    .replace(/<br\s*\/?>|<\/(p|h\d|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

export const local: Provider = {
  name: "local",
  liveMode: "LOCAL",
  alwaysLive: true,
  hasKey: () => true,
  async live(op, params, signal) {
    if (op !== "scrape") throw new Error(`local.${op} unknown op`);
    const url = new URL(String(params.url));
    if (!allowedOrigins().has(url.origin)) throw new Error(`local.scrape only fetches our own host, refusing ${url.origin}`);
    const res = await fetch(url, { signal, headers: { "cache-control": "no-cache" } });
    const html = await res.text();
    if (!res.ok) throw new Error(`local.scrape ${url.pathname} responded ${res.status}`);
    return { data: { url: url.toString(), status: res.status, fetchedAt: new Date().toISOString(), html, text: htmlToText(html) }, sourceUrls: [url.toString()] };
  },
  async seed() {
    return null;
  },
};
