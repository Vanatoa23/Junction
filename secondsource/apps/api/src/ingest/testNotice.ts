import type { FastifyInstance } from "fastify";
import { UpdateTestNoticeRequest, type TestNoticeState } from "@secondsource/shared";
import { config } from "../config";
import { pool } from "../db/pool";

/**
 * The TEST supplier-notices page. Hosted by us, watched through Context.dev.
 * Always visibly labelled TEST (the label is part of the page text so any
 * scrape includes it; classifiers must not treat it as a real-world source,
 * incidents derived from it carry is_test=true).
 *
 *  GET  /test-notice        HTML page with an inline editor (edit from a phone)
 *  GET  /test-notice/state  JSON {text, updatedAt, url}
 *  PUT  /test-notice        JSON {text}   (also POST /test-notice/edit for the HTML form)
 *
 * No auth: it is a demo page on a demo host. Do not put anything real in it.
 */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function getState(): Promise<TestNoticeState> {
  const r = await pool.query(`SELECT text, updated_at FROM test_notice WHERE id = 1`);
  const row = r.rows[0];
  return { text: row?.text ?? "", updatedAt: new Date(row?.updated_at ?? Date.now()).toISOString(), url: `${config.PUBLIC_BASE_URL}/test-notice` };
}

const save = (text: string) =>
  pool.query(`INSERT INTO test_notice (id, text, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET text = $1, updated_at = now()`, [text]);

export function registerTestNotice(app: FastifyInstance) {
  app.get("/test-notice", async (_req, reply) => {
    const s = await getState();
    // The <main> block is the "watched" content; the editor sits outside it so selectors can exclude it.
    reply.type("text/html; charset=utf-8").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>TEST supplier notices (not real)</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:680px;margin:2rem auto;padding:0 1rem}
.test{background:#fff3cd;border:2px solid #b58100;padding:.5rem 1rem;border-radius:8px;font-weight:700}
textarea{width:100%;min-height:8rem;font:inherit}button{font:inherit;padding:.5rem 1rem}</style></head>
<body>
<div class="test">TEST PAGE. Demo data for SecondSource. Nothing on this page is a real-world notice.</div>
<main id="notice"><h1>Supplier and port notices (TEST)</h1>
<p>Last updated: ${esc(s.updatedAt)}</p>
<p id="notice-text">${esc(s.text)}</p></main>
<form id="editor" method="post" action="/test-notice/edit"><h2>Edit (demo only)</h2>
<textarea name="text">${esc(s.text)}</textarea><p><button type="submit">Publish notice</button></p></form>
</body></html>`);
  });

  app.get("/test-notice/state", async () => getState());

  app.put("/test-notice", async (req, reply) => {
    const body = UpdateTestNoticeRequest.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "bad_request", detail: body.error.flatten() });
    await save(body.data.text);
    return getState();
  });

  // Plain HTML form post (urlencoded) from the page's own editor.
  app.post<{ Body: { text?: string } }>("/test-notice/edit", async (req, reply) => {
    const text = String(req.body?.text ?? "").slice(0, 5000);
    await save(text);
    return reply.redirect("/test-notice", 303);
  });
}
