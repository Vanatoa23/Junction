import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Context.dev webhook signature (DOCUMENTED in docs/api-findings.md, UNVERIFIED against the real service).
 *  X-Context-Signature: t=<unix>,v1=<hex>
 *  v1 = HMAC_SHA256(key = full secret string incl. "whsec_" (no base64 decode), data = "<t>." + rawBodyBytes), hex.
 *  Reject if |now - t| > 300 s. Constant-time compare.
 */
export const SIGNATURE_TOLERANCE_S = 300;

export type SignatureResult = { ok: true; timestamp: number } | { ok: false; reason: "missing" | "malformed" | "stale" | "mismatch" };

export function sign(secret: string, rawBody: Buffer | string, t: number): string {
  const v1 = createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest("hex");
  return `t=${t},v1=${v1}`;
}

export function verifySignature(secret: string, header: string | undefined, rawBody: Buffer, nowMs = Date.now()): SignatureResult {
  if (!header) return { ok: false, reason: "missing" };
  const parts: Record<string, string> = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  if (!Number.isInteger(t) || !/^[0-9a-f]{64}$/i.test(parts.v1 ?? "")) return { ok: false, reason: "malformed" };
  if (Math.abs(nowMs / 1000 - t) > SIGNATURE_TOLERANCE_S) return { ok: false, reason: "stale" };
  const expected = createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest();
  const given = Buffer.from(parts.v1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected) ? { ok: true, timestamp: t } : { ok: false, reason: "mismatch" };
}
