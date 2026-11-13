import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';

// Run alongside pnpm dev. E2E_BASE_URL, DATABASE_URL, DATABASE_SSL and
// E2E_TIMEOUT_MS may be set explicitly; .env is read when available.
if (existsSync('.env') && typeof process.loadEnvFile === 'function') process.loadEnvFile('.env');
const base = (process.env.E2E_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const timeout = Number(process.env.E2E_TIMEOUT_MS || 180000);
if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('E2E_TIMEOUT_MS must be a positive number');
const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Client } = require('pg');
const db = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://secondsource:secondsource@localhost:5434/secondsource', ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 10000 });
const abort = new AbortController();
const messages = [];
let streamError;
let streamTask;
const start = performance.now();
let failed = false;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function step(name, fn) {
  const t = performance.now();
  try { const result = await fn(); console.log(`PASS ${name} (${((performance.now() - t) / 1000).toFixed(2)}s)`); return result; }
  catch (error) { failed = true; console.error(`FAIL ${name} (${((performance.now() - t) / 1000).toFixed(2)}s): ${error.message}`); throw error; }
}
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = body; }
  return { response, data };
}
async function json(path, options) {
  const { response, data } = await request(path, options);
  assert(response.ok, `${path}: HTTP ${response.status} ${JSON.stringify(data)}`);
  return data;
}
const post = (body) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
async function until(description, fn) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    if (streamError) throw new Error(`SSE connection lost: ${streamError.message}`);
    const value = await fn();
    if (value) return value;
    await delay(500);
  }
  throw new Error(`Timed out after ${timeout}ms waiting for ${description}`);
}
async function openStream() {
  const response = await fetch(`${base}/stream`, { signal: abort.signal });
  assert(response.ok && response.body && response.headers.get('content-type')?.includes('text/event-stream'), `/stream: HTTP ${response.status}, expected SSE`);
  const reader = response.body.getReader();
  streamTask = (async () => {
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) throw new Error('stream ended');
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          const data = frame.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
          if (data) messages.push(JSON.parse(data));
        }
      }
    } catch (error) { if (!abort.signal.aborted) streamError = error; }
  })();
}
const suppliers = [
  ['Nordpack Packaging', 'nordpack.example', 'DE'], ['Baltic Carton', 'balticcarton.example', 'FI'],
  ['Rhine Foils', 'rhinefoils.example', 'NL'], ['Fennia Cultures', 'fenniacultures.example', 'FI'],
  ['Danish Enzymes', 'danishenzymes.example', 'DK'], ['Hansa Labels', 'hansalabels.example', 'DE'],
  ['Oulu Plastics', 'ouluplastics.example', 'FI'], ['Antwerp Resins', 'antwerpresins.example', 'BE'],
  ['Gothenburg Crates', 'gbgcrates.example', 'SE'], ['Tallinn Caps', 'tallinncaps.example', 'EE'],
].map(([name, domain, country]) => ({ name, domain, country }));

try {
  await step('Connect to API, database and SSE', async () => {
    const health = await json('/health'); assert(health.ok && health.db, 'API or database is unhealthy');
    await db.connect(); await openStream();
  });
  const rows = await step('Submit demo suppliers', async () => {
    const { response, data } = await request('/suppliers/resolve', post({ suppliers }));
    assert(response.status === 202, `/suppliers/resolve: expected HTTP 202, got ${response.status} ${JSON.stringify(data)}`);
    assert(Array.isArray(data.suppliers) && data.suppliers.length === suppliers.length, 'resolve did not return all suppliers');
    assert(new Set(data.suppliers.map((row) => row.edgeId)).size === suppliers.length && data.suppliers.every((row) => row.edgeId), 'resolve returned missing or duplicate edge IDs');
    return data.suppliers;
  });
  await step('Wait for all submitted suppliers to be MONITORED', async () => {
    const ids = new Set(rows.map((row) => row.edgeId));
    await until('all suppliers to be monitored', async () => {
      const data = await json('/suppliers');
      const found = data.suppliers.filter((row) => ids.has(row.edgeId));
      const blocked = found.filter((row) => ['AMBIGUOUS', 'UNRESOLVED'].includes(row.status));
      assert(!blocked.length, `suppliers need intervention: ${blocked.map((row) => `${row.input.name}=${row.status}`).join(', ')}`);
      return found.length === ids.size && found.every((row) => row.status === 'MONITORED');
    });
  });
  const marker = `E2E-${randomUUID()}`;
  const notice = `NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed. ${marker}.`;
  const noticeState = await step('Edit TEST notice', async () => {
    const data = await json('/test-notice', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: notice }) });
    assert(data.text === notice && data.url, 'TEST notice was not saved'); return data;
  });
  const event = await step('Wait for matching event.received over SSE', async () => {
    const checked = new Set();
    return until('event.received for the edited notice', async () => {
      for (const message of messages) {
        const event = message.type === 'event.received' && message.data?.event;
        if (!event || checked.has(event.id)) continue;
        checked.add(event.id);
        const result = await db.query('SELECT fetched_text FROM event WHERE id = $1', [event.id]);
        if (result.rows[0]?.fetched_text?.includes(marker)) {
          assert(event.isTest && event.sourceUrl === noticeState.url, 'event has incorrect TEST flag or source URL');
          return event;
        }
      }
    });
  });
  const alert = await step('Wait for matching alert.created over SSE', async () => until('alert.created for the event and Nordpack', async () => {
    for (const message of messages) {
      const alert = message.type === 'alert.created' && message.data?.alert;
      if (!alert || alert.edgeId !== rows.find((row) => row.input.name === 'Nordpack Packaging')?.edgeId) continue;
      const detail = await json(`/incidents/${encodeURIComponent(alert.incidentId)}`);
      if (detail.incident?.eventId === event.id) return alert;
    }
  }));
  await step('Verify quote, source URL and four latency fields', async () => {
    const detail = await json(`/incidents/${encodeURIComponent(alert.incidentId)}`);
    const fetched = (await db.query('SELECT fetched_text FROM event WHERE id = $1', [event.id])).rows[0]?.fetched_text;
    assert(typeof fetched === 'string' && typeof alert.quote === 'string' && alert.quote.length > 0 && fetched.includes(alert.quote), 'alert quote is not verbatim in fetched source text');
    assert(detail.incident.quote === alert.quote && alert.sourceUrl === noticeState.url && detail.incident.sourceUrl === noticeState.url, 'incident/alert quote or source URL mismatch');
    for (const field of ['tSource', 'tReceived', 'tClassified', 'tAlert']) {
      assert(Object.hasOwn(alert.latency || {}, field), `missing latency field ${field}`);
      const value = alert.latency[field];
      assert(value === null && field === 'tSource' || typeof value === 'string' && Number.isFinite(Date.parse(value)), `invalid latency ${field}: ${value}`);
    }
  });
  const candidates = await step('Wait for alternatives and verify C2, C5 and passing checks', async () => {
    const result = await until('alternatives', async () => {
      const data = await json(`/incidents/${encodeURIComponent(alert.incidentId)}/alternatives?edgeId=${encodeURIComponent(alert.edgeId)}`);
      return data.ready && data;
    });
    const find = (name) => result.candidates.find((candidate) => candidate.company?.name === name);
    const failedCandidate = find('Maasvlakte Wrap'); const unknown = find('Tampere Board'); const passing = find('Karlstad Pack');
    const check = (candidate, id) => candidate?.checks?.find((item) => item.check === id)?.status;
    assert(failedCandidate?.verdict === 'FAILED' && check(failedCandidate, 'C2') === 'FAIL', 'Maasvlakte Wrap must fail C2');
    assert(unknown?.verdict === 'UNVERIFIED' && check(unknown, 'C5') === 'UNKNOWN', 'Tampere Board must be unverified on C5');
    assert(passing?.verdict === 'VERIFIED' && ['C1', 'C2', 'C3', 'C4', 'C5'].every((id) => check(passing, id) === 'PASS'), 'Karlstad Pack must pass C1–C5');
    return { failedCandidate, passing };
  });
  await step('Approve passing candidate and verify approval_audit row', async () => {
    const actor = `e2e-${randomUUID()}`;
    const result = await json(`/candidates/${encodeURIComponent(candidates.passing.id)}/approve`, post({ actor, note: 'E2E verification' }));
    assert(result.candidate?.status === 'APPROVED' && result.audit?.id, 'approval response lacks approved candidate or audit');
    const audit = await db.query('SELECT id, candidate_id, actor, decision, snapshot FROM approval_audit WHERE id = $1', [result.audit.id]);
    const row = audit.rows[0];
    assert(row?.candidate_id === candidates.passing.id && row.actor === actor && row.decision === 'APPROVE' && row.snapshot?.verdict === 'VERIFIED', 'matching approval_audit row not found');
  });
  await step('Reject approval of failing candidate', async () => {
    const { response, data } = await request(`/candidates/${encodeURIComponent(candidates.failedCandidate.id)}/approve`, post({ actor: 'e2e', note: 'Must fail' }));
    assert(response.status === 409, `expected HTTP 409, got ${response.status} ${JSON.stringify(data)}`);
  });
} catch (error) {
  if (!failed) console.error(`FAIL setup: ${error.message}`);
  process.exitCode = 1;
} finally {
  abort.abort();
  if (streamTask) await streamTask;
  await db.end().catch(() => {});
  console.log(`Total: ${((performance.now() - start) / 1000).toFixed(2)}s`);
}
