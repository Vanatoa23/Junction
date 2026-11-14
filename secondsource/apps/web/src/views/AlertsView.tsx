import { useEffect, useState } from "react";
import type { Candidate, MapIncident } from "@secondsource/shared";
import { api } from "../lib/api";
import { useData } from "../lib/data";
import { ago, noticedWord, SEVERITY_WORD } from "../lib/words";
import { PanelShell, RiskPill } from "../components/Ui";

/** What happened, newest first. Opening one shows the five steps from "we noticed" to "you approved". */
export function AlertsView({ selected, onSelect, onFindReplacement, onOpenSupplier, hideDetail }: {
  hideDetail: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onFindReplacement: (incidentId: string, edgeId: string) => void;
  onOpenSupplier: (edgeId: string) => void;
}) {
  const { map } = useData();
  const incidents = map?.incidents ?? [];
  const chosen = incidents.find((i) => i.id === selected) ?? null;

  return (
    <>
      <main className="list-page">
        <h1>Alerts</h1>
        <p className="muted lead">What happened that could affect your suppliers, newest first.</p>
        {incidents.length === 0 ? (
          <div className="empty">
            <b>All quiet.</b>
            <p className="muted">We are watching for strikes, port closures, fires, sanctions and similar news. Nothing affects your suppliers right now.</p>
          </div>
        ) : (
          incidents.map((i) => (
            <button key={i.id} className={`row-card${i.id === selected ? " on" : ""}`} onClick={() => onSelect(i.id)}>
              <div className="row between">
                <b>{i.headline}</b>
                <span className={`sev ${i.severity.toLowerCase()}`}>{SEVERITY_WORD[i.severity]}</span>
              </div>
              <div className="muted">
                {i.affected.length ? `${i.affected.length} of your suppliers affected: ${i.affected.slice(0, 3).join(", ")}${i.affected.length > 3 ? "…" : ""}` : "None of your suppliers is directly affected."}
              </div>
              <div className="muted small">{ago(i.createdAt)}{i.isTest ? " · Demo notice" : ""}</div>
            </button>
          ))
        )}
      </main>
      {chosen && !hideDetail && <IncidentPanel incident={chosen} onClose={() => onSelect(null)} onFindReplacement={onFindReplacement} onOpenSupplier={onOpenSupplier} />}
    </>
  );
}

function IncidentPanel({ incident, onClose, onFindReplacement, onOpenSupplier }: {
  incident: MapIncident; onClose: () => void; onFindReplacement: (i: string, e: string) => void; onOpenSupplier: (e: string) => void;
}) {
  const { map, version } = useData();
  const affected = (map?.suppliers ?? []).filter((s) => s.alert?.incidentId === incident.id);
  const [alts, setAlts] = useState<Record<string, Candidate[]>>({});

  useEffect(() => {
    let live = true;
    Promise.all(affected.map((s) => api.alternatives(incident.id, s.edgeId).then((r) => [s.edgeId, r.candidates] as const))).then((pairs) => {
      if (live) setAlts(Object.fromEntries(pairs));
    }).catch(() => {});
    return () => { live = false; };
  }, [incident.id, affected.length, version]);

  // the same candidate can be offered for several affected suppliers: count each company once
  const all = [...new Map(Object.values(alts).flat().map((c) => [c.company.id, c])).values()];
  const everything = Object.values(alts).flat();
  const safe = all.filter((c) => c.verdict === "VERIFIED").length;
  const approved = everything.find((c) => c.status === "APPROVED");
  const noticed = noticedWord(incident.noticedInSeconds);

  const steps: Array<{ title: string; text: string; done: boolean }> = [
    { title: "We noticed", text: noticed ?? `Published ${ago(incident.createdAt)}`, done: true },
    { title: "We checked", text: "We read the notice and found where it happens.", done: true },
    { title: "Suppliers affected", text: affected.length ? `${affected.length} of your suppliers: ${affected.map((a) => a.name).join(", ")}.` : "None of yours.", done: true },
    { title: "Replacements found", text: all.length ? `${all.length} candidate${all.length === 1 ? "" : "s"} checked, ${safe} safe to approve.` : "Looking…", done: all.length > 0 },
    { title: "You approved", text: approved ? `${approved.company.name} approved.` : "Waiting for your decision.", done: !!approved },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <PanelShell title={incident.headline} sub={`${SEVERITY_WORD[incident.severity]} · ${ago(incident.createdAt)}${incident.isTest ? " · Demo notice" : ""}`} onClose={onClose}>
      <ol className="timeline">
        {steps.map((s, i) => (
          <li key={s.title} className={s.done ? "done" : i === current ? "now" : ""}>
            <i />
            <div><b>{s.title}</b><div className="muted small">{s.text}</div></div>
          </li>
        ))}
      </ol>

      <section className="sect">
        <h3>Your suppliers affected</h3>
        {affected.length === 0 && <p className="muted">None of your direct suppliers is affected.</p>}
        {affected.map((s) => (
          <div className="choice" key={s.edgeId}>
            <div>
              <button className="link strong" onClick={() => onOpenSupplier(s.edgeId)}>{s.name}</button>
              <div><RiskPill level={s.risk.level} score={s.risk.score} /></div>
            </div>
            <button className="primary small" onClick={() => onFindReplacement(incident.id, s.edgeId)}>Find a replacement</button>
          </div>
        ))}
      </section>

      <section className="sect">
        <h3>What the notice says</h3>
        <blockquote>{incident.quote}</blockquote>
        <details>
          <summary>How we know</summary>
          <p className="muted small">We read this notice at <a href={incident.sourceUrl} target="_blank" rel="noreferrer">{incident.sourceUrl.replace(/^https?:\/\//, "")}</a>{incident.isTest ? ", a demo page that is clearly marked as a test" : ""}. The sentence above is copied word for word from it.</p>
        </details>
      </section>
    </PanelShell>
  );
}
