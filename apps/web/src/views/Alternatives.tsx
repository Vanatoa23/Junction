import { useEffect, useMemo, useState } from "react";
import type { Candidate, CheckId, CheckResult, Verdict } from "@secondsource/shared";
import { api } from "../lib/api";
import { incidentsFromAlerts, useStore } from "../lib/store";
import { CheckPill, Empty, EvidenceList, KeyChips, ModeBadge, SeededBadge, VerdictBadge, when } from "../components/ui";

const CHECKS: Array<[CheckId, string, string]> = [
  ["C1", "C1 Region", "No shared region (regions are nested: FI covers FI-UUS)"],
  ["C2", "C2 Port", "No shared port"],
  ["C3", "C3 Upstream plant", "Its own tier-2 suppliers do not touch the incident's plants"],
  ["C4", "C4 Sanction", "Neither it nor its parent is on the incident's sanctions programme"],
  ["C5", "C5 Parent", "No shared owner within 2 hops"],
  ["LIVE_NEWS", "Live news check", "Fresh news search finds no sign of the same incident type nearby (stretch goal)"],
];

const GROUPS: Array<{ v: Verdict; title: string; blurb: string }> = [
  { v: "VERIFIED", title: "Verified", blurb: "All checks pass, each with evidence. Only these can be approved." },
  { v: "UNVERIFIED", title: "Unverified", blurb: "No failure, but at least one unknown. Unknown never counts as a pass, and these never rank above verified ones." },
  { v: "FAILED", title: "Excluded", blurb: "At least one check failed. Shown greyed out with the failing row." },
];

export function AlternativesView({ incidentId, edgeId }: { incidentId: string | null; edgeId: string | null }) {
  const { alerts, altVersion } = useStore();
  const incidents = incidentsFromAlerts(alerts);
  const inc = incidents.find((i) => i.incidentId === incidentId) ?? incidents[0];
  const affected = inc?.alerts ?? [];
  const edge = affected.find((a) => a.edgeId === edgeId)?.edgeId ?? affected[0]?.edgeId ?? null;
  const [cands, setCands] = useState<Candidate[] | null>(null);
  const [ready, setReady] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // reset only when the selection changes; a refresh (SSE, approval) keeps the cards on screen
  useEffect(() => { setCands(null); setErr(null); setReady(true); }, [inc?.incidentId, edge]);

  useEffect(() => {
    if (!inc || !edge) return;
    let live = true; let timer: number | undefined;
    const load = () => api.alternatives(inc.incidentId, edge).then((r) => {
      if (!live) return;
      setCands(r.candidates); setReady(r.ready);
      if (!r.ready) timer = window.setTimeout(load, 2000);
    }).catch((e: Error) => live && setErr(e.message));
    load();
    return () => { live = false; window.clearTimeout(timer); };
  }, [inc?.incidentId, edge, altVersion]);

  const grouped = useMemo(() => GROUPS.map((g) => ({ ...g, list: (cands ?? []).filter((c) => c.verdict === g.v) })), [cands]);

  return (
    <>
      <div className="page-head">
        <h2>Alternatives</h2>
        <p>Replacement suppliers that the same incident cannot reach. Each candidate runs five explicit checks plus a live news check; a human approves only a candidate that passes every row.</p>
      </div>
      {!inc ? <Empty>No incident yet, so there is nothing to replace. Trigger one from the TEST page tab.</Empty> : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <label className="field" htmlFor="sup" style={{ margin: 0 }}>Replacing</label>
            <select id="sup" value={edge ?? ""} onChange={(e) => { location.hash = `#/alternatives/${inc.incidentId}/${e.target.value}`; }} style={{ maxWidth: 320 }}>
              {affected.map((a) => <option key={a.edgeId} value={a.edgeId}>{a.supplierName}</option>)}
            </select>
            <span className="small muted">for incident: {inc.alerts[0]!.incidentType.replace("_", " ").toLowerCase()}, {when(inc.latest)}</span>
            <a className="btn" href={`#/incident/${inc.incidentId}`}>Incident</a>
          </div>
          {err ? <Empty>Could not load alternatives: {err}</Empty>
            : cands === null ? <Empty>Loading candidates…</Empty>
            : !ready ? <Empty>Computing checks… candidates appear as soon as the worker is done.</Empty>
            : cands.length === 0 ? <Empty>No candidates for this supplier yet. Either none were found or the alternatives step has not run for this incident.</Empty>
            : grouped.map((g) => (
              <section key={g.v} aria-labelledby={`g-${g.v}`}>
                <div className="group-title"><h3 id={`g-${g.v}`}>{g.title} ({g.list.length})</h3><span className="note">{g.blurb}</span></div>
                {g.list.length === 0 ? <div className="note" style={{ marginBottom: 8 }}>None.</div> : g.list.map((c) => <CandidateCard key={c.id} c={c} />)}
              </section>
            ))}
        </>
      )}
    </>
  );
}

function CandidateCard({ c }: { c: Candidate }) {
  const { approve, audits } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const audit = audits[c.id];
  const approved = c.status === "APPROVED";
  const can = c.verdict === "VERIFIED" && c.status === "PROPOSED";
  const byId = new Map<CheckId, CheckResult>(c.checks.map((r) => [r.check, r]));
  const why = c.verdict === "FAILED" ? "Excluded: a check failed." : c.verdict === "UNVERIFIED" ? "Not approvable: at least one check is unknown." : approved ? "Already approved." : "";

  const go = async () => {
    setBusy(true); setErr(null);
    try { await approve(c.id, note.trim() || null); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <article className={`cand ${c.verdict}`} aria-label={`${c.company.name}: ${c.verdict}`}>
      <div className="cand-head">
        <div>
          <h3 className="cand-title" style={{ fontSize: "1.1rem" }}>{c.rank !== null && <span className="muted">#{c.rank} </span>}{c.company.name}</h3>
          <div className="small muted">{c.company.legalName ?? ""} · {c.company.domain ?? "no domain"} · {c.company.country ?? "?"} · {c.company.category ?? ""}</div>
        </div>
        <div className="row"><VerdictBadge verdict={c.verdict} /><ModeBadge mode={c.mode} />{c.seeded && <SeededBadge />}{approved && <span className="badge b-good">APPROVED</span>}</div>
      </div>
      <KeyChips keys={c.footprint} />
      <div className="scroll" style={{ marginTop: 10 }}>
        <table>
          <caption className="sr">Checks for {c.company.name}</caption>
          <thead><tr><th scope="col">Check</th><th scope="col">Result</th><th scope="col">Why</th><th scope="col">Evidence</th></tr></thead>
          <tbody>
            {CHECKS.map(([id, label, rule]) => {
              const r = byId.get(id);
              return (
                <tr key={id} className={r?.status === "FAIL" ? "" : ""}>
                  <td><b>{label}</b><div className="small muted">{rule}</div></td>
                  <td>{r ? <CheckPill status={r.status} /> : <span className="badge b-neutral" title="This check has not run">NOT RUN</span>}</td>
                  <td className="small">{r ? r.reason : id === "LIVE_NEWS" ? "Not run yet (stretch goal). It does not affect the verdict." : "No result reported."}</td>
                  <td className="small">{r ? <EvidenceList evidence={r.evidence} /> : <span className="muted">n/a</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {!approved && c.verdict === "VERIFIED" && (
          <>
            <label className="sr" htmlFor={`n-${c.id}`}>Approval note (optional)</label>
            <input id={`n-${c.id}`} type="text" placeholder="Note for the audit row (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ maxWidth: 320 }} />
          </>
        )}
        <button className="primary" onClick={go} disabled={!can || busy} aria-describedby={`why-${c.id}`}>{busy ? "Approving…" : approved ? "Approved" : "Approve this supplier"}</button>
        <span id={`why-${c.id}`} className="note">{can ? "Every check passed. Approval writes an audit row." : why}</span>
      </div>
      {err && <div className="badge b-bad" role="alert" style={{ marginTop: 8, whiteSpace: "normal" }}>Approval failed: {err}</div>}
      {approved && (
        <div className="card" style={{ marginTop: 12, marginBottom: 0, background: "var(--good-soft)" }} role="status">
          <h3>Audit record</h3>
          {audit ? (
            <dl className="kv">
              <dt>Decision</dt><dd>{audit.decision}</dd>
              <dt>By</dt><dd>{audit.actor}</dd>
              <dt>When</dt><dd>{when(audit.createdAt)}</dd>
              <dt>Note</dt><dd>{audit.note ?? "none"}</dd>
              <dt>Snapshot</dt><dd>verdict {audit.snapshot.verdict}; {audit.snapshot.checks.map((r) => `${r.check} ${r.status}`).join(", ")}</dd>
            </dl>
          ) : <p className="small" style={{ margin: 0 }}>Approved earlier. The audit row is stored on the server (this screen only shows the audit created in this session).</p>}
        </div>
      )}
    </article>
  );
}
