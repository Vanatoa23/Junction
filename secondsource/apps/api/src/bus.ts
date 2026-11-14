import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import { SseEnvelope, type SsePayload } from "@secondsource/shared";
import { listenClient, pool } from "./db/pool";

/**
 * SSE bus. CONTRACT:
 *  - Anyone (API or worker) calls publish({type, data}).
 *  - publish() validates against the shared SseEnvelope schema and does
 *    pg_notify('sse', json). Postgres NOTIFY limit is ~8 kB, so keep payloads
 *    small (ids + small objects); clients can refetch REST resources.
 *  - Only the API process runs startHub(): it LISTENs and writes to every
 *    open GET /stream response.
 */
const CHANNEL = "sse";
const MAX_NOTIFY_BYTES = 7500;

export async function publish(payload: SsePayload): Promise<SseEnvelope> {
  const envelope = SseEnvelope.parse({ id: randomUUID(), at: new Date().toISOString(), ...payload });
  const text = JSON.stringify(envelope);
  if (Buffer.byteLength(text) > MAX_NOTIFY_BYTES) {
    throw new Error(`SSE payload for ${envelope.type} too large (${Buffer.byteLength(text)} B); send ids and let clients refetch`);
  }
  await pool.query("SELECT pg_notify($1, $2)", [CHANNEL, text]);
  return envelope;
}

const clients = new Set<ServerResponse>();
let seq = 0;

export function addSseClient(res: ServerResponse) {
  clients.add(res);
  res.on("close", () => clients.delete(res));
}

function fanOut(envelope: SseEnvelope) {
  const frame = `id: ${++seq}\nevent: ${envelope.type}\ndata: ${JSON.stringify(envelope)}\n\n`;
  for (const res of clients) res.write(frame);
}

/** API process only. Reconnects with backoff if the LISTEN connection drops. */
export async function startHub(log: (m: string) => void = console.log) {
  const connect = async (): Promise<void> => {
    try {
      const c = await listenClient();
      c.on("notification", (m) => {
        if (m.channel !== CHANNEL || !m.payload) return;
        try {
          fanOut(SseEnvelope.parse(JSON.parse(m.payload)));
        } catch (e) {
          log(`bad sse payload dropped: ${(e as Error).message}`);
        }
      });
      c.on("error", () => {});
      c.on("end", () => setTimeout(connect, 2000));
      await c.query(`LISTEN ${CHANNEL}`);
    } catch (e) {
      log(`sse hub connect failed, retrying: ${(e as Error).message}`);
      setTimeout(connect, 2000);
    }
  };
  await connect();
  setInterval(() => {
    for (const res of clients) res.write(": keepalive\n\n");
  }, 15000).unref();
}
