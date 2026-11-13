import { useEffect, useState } from "react";
import { SSE_EVENT_TYPES, type HealthResponse, type SseEnvelope, type SupplierRow } from "@secondsource/shared";

/**
 * MINIMAL SHELL from Foundation: proves web -> API -> DB and the SSE stream work.
 * The UI thread replaces this file and owns everything under apps/web.
 */
const api = (path: string) => fetch(`/api${path}`).then((r) => r.json());

const badge = (m: string) => (
  <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 6, background: m === "LIVE" ? "#d6f5dd" : m === "REC" ? "#dce8ff" : "#ffe9c2", marginLeft: 6 }}>{m}</span>
);

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [feed, setFeed] = useState<SseEnvelope[]>([]);

  useEffect(() => {
    api("/health").then(setHealth).catch(() => setHealth(null));
    api("/suppliers").then((r) => setSuppliers(r.suppliers ?? [])).catch(() => {});
    const es = new EventSource("/api/stream");
    for (const t of SSE_EVENT_TYPES) {
      es.addEventListener(t, (e) => setFeed((f) => [JSON.parse((e as MessageEvent).data) as SseEnvelope, ...f].slice(0, 50)));
    }
    return () => es.close();
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>SecondSource</h1>
      <p>Foundation shell. API: {health?.ok ? "up" : "down"}; DB: {health?.db ? "up" : "down"}.</p>
      {health && (
        <p>
          Providers: {Object.entries(health.providers).map(([k, v]) => (
            <span key={k} style={{ marginRight: 12 }}>{k}{badge(v.mode)}</span>
          ))}
        </p>
      )}
      {health && <p>TEST notice page: <a href={health.testNoticeUrl} target="_blank">{health.testNoticeUrl}</a></p>}
      <h2>Suppliers ({suppliers.length})</h2>
      <ul>
        {suppliers.map((s) => (
          <li key={s.edgeId}>
            {s.input.name} <small>{s.status}</small>
            {badge(s.mode)}
            {s.seeded && <span style={{ fontSize: 11, marginLeft: 6 }}>SEEDED</span>}
          </li>
        ))}
      </ul>
      <h2>Live feed (SSE)</h2>
      {feed.length === 0 ? <p>No events yet.</p> : <ul>{feed.map((e) => <li key={e.id}><code>{e.type}</code> {e.at}</li>)}</ul>}
    </main>
  );
}
