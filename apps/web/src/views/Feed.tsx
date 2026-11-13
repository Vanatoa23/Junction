import { useMemo } from "react";
import type { Alert, Event } from "@secondsource/shared";
import { useStore } from "../lib/store";
import { Empty, KeyChips, LatencyChips, ModeBadge, SeverityBadge, SourceLink, TestBadge, ViaBadge, when } from "../components/ui";

type Item = { kind: "event"; at: string; e: Event } | { kind: "alert"; at: string; a: Alert };

export function FeedView() {
  const { events, alerts, fresh, sse, mode } = useStore();
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [
      ...events.map((e) => ({ kind: "event" as const, at: e.latency.tReceived ?? e.createdAt, e })),
      ...alerts.map((a) => ({ kind: "alert" as const, at: a.latency.tAlert ?? a.createdAt, a })),
    ];
    return list.sort((x, y) => y.at.localeCompare(x.at));
  }, [events, alerts]);

  return (
    <>
      <div className="page-head">
        <h2>Live feed</h2>
        <p>Observed changes and the alerts they cause, newest first. Every alert carries its source URL, the verbatim quote that the code checked against the fetched text, and the time each stage took.</p>
      </div>
      <div className="row small muted" style={{ marginBottom: 12 }}>
        <span className={`badge ${sse === "open" ? "b-good" : sse === "off" ? "b-mock" : "b-warn"}`}>
          {sse === "open" ? "stream connected" : sse === "off" ? "stream off (mock mode)" : sse === "closed" ? "stream closed" : "stream connecting…"}
        </span>
        {mode !== "real" && <span>New items from the mock layer also appear here, labelled as mock data.</span>}
      </div>
      <div aria-live="polite" aria-relevant="additions">
        {items.length === 0 ? <Empty>No events yet. Edit the TEST notice page (see the TEST page tab) and the next poll will show up here.</Empty> : (
          <ul className="feed">
            {items.map((it) => (
              <li key={it.kind + (it.kind === "event" ? it.e.id : it.a.id)}>
                {it.kind === "alert" ? <AlertCard a={it.a} fresh={fresh.has(it.a.id)} /> : <EventCard e={it.e} fresh={fresh.has(it.e.id)} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AlertCard({ a, fresh }: { a: Alert; fresh: boolean }) {
  return (
    <article className={`item alert${fresh ? " fresh" : ""}`} aria-label={`Alert for ${a.supplierName}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <span className="badge b-bad">ALERT</span><SeverityBadge severity={a.severity} /><b>{a.supplierName}</b>
          <span className="muted small">{a.incidentType.replace("_", " ").toLowerCase()}</span>
        </div>
        <span className="small muted">{when(a.createdAt)}</span>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <ViaBadge via={a.via} /><ModeBadge mode={a.mode} />{a.isTest && <TestBadge />}
        <span className="small muted">source:</span> <SourceLink url={a.sourceUrl} />
      </div>
      <blockquote>“{a.quote}”</blockquote>
      <div className="small muted" style={{ marginBottom: 4 }}>Matched supplier keys (incident → supplier, regions nested):</div>
      <KeyChips keys={a.matchedKeys.map((m) => m.supplier)} />
      <LatencyChips latency={a.latency} />
      <div className="row" style={{ marginTop: 10 }}>
        <a className="btn" href={`#/incident/${a.incidentId}`}>Open incident</a>
        <a className="btn primary" style={{ background: "var(--accent)", color: "var(--accent-ink)", borderColor: "var(--accent)" }} href={`#/alternatives/${a.incidentId}/${a.edgeId}`}>Find alternatives</a>
      </div>
    </article>
  );
}

function EventCard({ e, fresh }: { e: Event; fresh: boolean }) {
  const dropped = e.status === "DROPPED";
  const cls = dropped ? "b-warn" : e.status === "INCIDENT" ? "b-bad" : e.status === "CLASSIFIED" ? "b-accent" : "b-neutral";
  return (
    <article className={`item ${dropped ? "drop" : "event"}${fresh ? " fresh" : ""}`} aria-label={`Event ${e.status.toLowerCase()}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row"><span className="badge b-neutral">EVENT</span><span className={`badge ${cls}`}>{e.status}</span><ViaBadge via={e.via} /><ModeBadge mode={e.mode} />{e.isTest && <TestBadge />}</div>
        <span className="small muted">{when(e.latency.tReceived ?? e.createdAt)}</span>
      </div>
      <div className="row" style={{ marginTop: 6 }}><span className="small muted">source:</span> <SourceLink url={e.sourceUrl} /></div>
      {dropped && <p className="small" style={{ margin: "6px 0 0" }}><b>Dropped and logged:</b> {e.dropReason ?? "no reason recorded"}. No alert was raised.</p>}
      {e.status === "RECEIVED" && <p className="small muted" style={{ margin: "6px 0 0" }}>Classifying…</p>}
      <LatencyChips latency={e.latency} />
    </article>
  );
}
