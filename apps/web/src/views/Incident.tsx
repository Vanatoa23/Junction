import { useEffect, useState } from "react";
import type { IncidentDetailResponse } from "@secondsource/shared";
import { api } from "../lib/api";
import { incidentsFromAlerts, useStore } from "../lib/store";
import { Empty, KeyChips, LatencyChips, ModeBadge, SeverityBadge, SourceLink, TestBadge, ViaBadge, when } from "../components/ui";

export function IncidentView({ incidentId }: { incidentId: string | null }) {
  const { alerts } = useStore();
  const list = incidentsFromAlerts(alerts);
  const id = incidentId ?? list[0]?.incidentId ?? null;
  const [data, setData] = useState<IncidentDetailResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setData(null); setErr(null);
    if (!id) return;
    let live = true;
    api.incident(id).then((d) => live && setData(d)).catch((e: Error) => live && setErr(e.message));
    return () => { live = false; };
  }, [id, alerts.length]);

  return (
    <>
      <div className="page-head">
        <h2>Incident</h2>
        <p>What the incident touches (its footprint) and which of your suppliers it reaches. The quote below was checked by code against the fetched text.</p>
      </div>
      {list.length > 1 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <label className="field" htmlFor="inc" style={{ margin: 0 }}>Incident</label>
          <select id="inc" value={id ?? ""} onChange={(e) => { location.hash = `#/incident/${e.target.value}`; }} style={{ maxWidth: 420 }}>
            {list.map((i) => <option key={i.incidentId} value={i.incidentId}>{when(i.latest)} · {i.alerts[0]!.incidentType} · {i.alerts.length} supplier{i.alerts.length === 1 ? "" : "s"}</option>)}
          </select>
        </div>
      )}
      {!id ? <Empty>No incident yet. When a change on a watched page is classified as an incident, it appears here.</Empty>
        : err ? <Empty>Could not load this incident: {err}</Empty>
        : !data ? <Empty>Loading incident…</Empty> : <Detail d={data} />}
    </>
  );
}

function Detail({ d }: { d: IncidentDetailResponse }) {
  const { incident: i, event: e, alerts } = d;
  return (
    <div className="stack">
      <section className="card" aria-labelledby="inc-h">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 id="inc-h" style={{ fontSize: "1.2rem" }}>{i.title}</h3>
          <div className="row"><SeverityBadge severity={i.severity} /><span className="badge b-neutral">{i.type.replace("_", " ")}</span><ModeBadge mode={i.mode} />{i.isTest && <TestBadge />}
            <span className={`badge ${i.confirmation === "CONFIRMED" ? "b-good" : "b-warn"}`} title="Confirmed = official or primary source, or two independent domains within 48 h">{i.confirmation}</span></div>
        </div>
        <blockquote>“{i.quote}”</blockquote>
        <div className="row small"><span className="muted">source:</span> <SourceLink url={i.sourceUrl} /> <ViaBadge via={e.via} /> <ModeBadge mode={e.mode} /> <span className="muted">detected {when(i.createdAt)}</span></div>
        <LatencyChips latency={e.latency} />
        {i.mode === "SEED" && <p className="note" style={{ marginBottom: 0 }}>Classified by the deterministic rule-based classifier (mode SEED), not by Gemini.</p>}
      </section>

      <div className="grid2">
        <section className="card" aria-labelledby="fp-h">
          <h3 id="fp-h">Incident footprint</h3>
          {i.footprint.length ? (
            <div className="scroll"><table>
              <thead><tr><th scope="col">Key</th><th scope="col">State</th><th scope="col">Evidence</th></tr></thead>
              <tbody>{i.footprint.map((k, n) => (
                <tr key={n}>
                  <td><KeyChips keys={[k]} /></td>
                  <td><span className={`state ${k.state}`}>{k.state}</span></td>
                  <td className="small">{k.sourceUrl ? <SourceLink url={k.sourceUrl} /> : <span className="muted">SEEDED</span>}{k.sourceQuote && <div className="muted">“{k.sourceQuote}”</div>}</td>
                </tr>))}
              </tbody>
            </table></div>
          ) : <p className="muted">No footprint keys were extracted.</p>}
          {i.unmappedNames.length > 0 && (
            <div className="badge b-warn" role="alert" style={{ whiteSpace: "normal", display: "block", marginTop: 10, padding: "8px 12px" }}>
              Names we could not map: {i.unmappedNames.join(", ")}. No automatic alert is raised until a person maps them.
            </div>
          )}
          <p className="note" style={{ marginBottom: 0 }}>Regions are nested: a key for <code>NL</code> also covers <code>NL-ZH</code>.</p>
        </section>

        <section className="card" aria-labelledby="aff-h">
          <h3 id="aff-h">Affected suppliers ({alerts.length})</h3>
          {alerts.length === 0 ? <p className="muted">No supplier of this client matches the footprint.</p> : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
              {alerts.map((a) => (
                <li key={a.id} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                  <div>
                    <b>{a.supplierName}</b>
                    <div><KeyChips keys={a.matchedKeys.map((m) => m.supplier)} /></div>
                  </div>
                  <a className="btn" href={`#/alternatives/${i.id}/${a.edgeId}`}>Alternatives</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
