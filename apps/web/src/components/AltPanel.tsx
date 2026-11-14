import { useEffect, useState } from "react";
import { COUNTRIES, type Candidate, type CheckId } from "@secondsource/shared";
import { api } from "../lib/api";
import { useData } from "../lib/data";
import { FAIL_WORD, CHECK_WORD, PASS_WORD, UNKNOWN_WORD, VERDICT_WORD } from "../lib/words";
import { PanelShell } from "./Ui";

const CHECKS: CheckId[] = ["C1", "C2", "C3", "C4", "C5"];
const ORDER = { VERIFIED: 0, UNVERIFIED: 1, FAILED: 2 } as const;

/** One plain sentence for a candidate. */
export function reasonFor(c: Candidate): string {
  if (c.status === "APPROVED") return "You approved this replacement.";
  if (c.verdict === "VERIFIED") return "Different region, port, owner and suppliers: this disruption cannot reach it.";
  const fails = c.checks.filter((k) => k.status === "FAIL");
  if (fails.length) return fails.map((k) => FAIL_WORD[k.check] ?? "It fails a safety check.").slice(0, 2).join(" ");
  const unknowns = c.checks.filter((k) => k.status === "UNKNOWN" && k.check !== "LIVE_NEWS");
  return unknowns.map((k) => UNKNOWN_WORD[k.check] ?? "We could not check everything.").slice(0, 2).join(" ");
}

/** Ranked replacements for one affected supplier. Approve is possible only for "Safe to approve". */
export function AltPanel({ incidentId, edgeId, onClose }: { incidentId: string; edgeId: string; onClose: () => void }) {
  const { map, version, reload } = useData();
  const supplier = map?.suppliers.find((s) => s.edgeId === edgeId);
  const incident = map?.incidents.find((i) => i.id === incidentId);
  const [cands, setCands] = useState<Candidate[] | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [approved, setApproved] = useState<Record<string, string>>({});
  const [how, setHow] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api.alternatives(incidentId, edgeId).then((r) => { if (live) { setCands(r.candidates); setReady(r.ready); } }).catch((e) => live && setErr((e as Error).message));
    return () => { live = false; };
  }, [incidentId, edgeId, version]);

  const approve = async (c: Candidate) => {
    setBusy(c.id);
    setErr(null);
    try {
      const r = await api.approve(c.id);
      setApproved((a) => ({ ...a, [c.id]: new Date(r.audit.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }));
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const sorted = [...(cands ?? [])].sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || (a.rank ?? 99) - (b.rank ?? 99));

  return (
    <PanelShell title={`Replacements for ${supplier?.name ?? "this supplier"}`} sub={incident?.headline} onClose={onClose}>
      {cands === null && !err && <p className="muted">Looking for replacements…</p>}
      {cands !== null && sorted.length === 0 && (
        <p className="muted">{ready ? "We have no candidate suppliers for this kind of product yet." : "Still checking candidates…"}</p>
      )}
      {sorted.map((c) => {
        const done = c.status === "APPROVED" || approved[c.id];
        const where = [c.company.city, COUNTRIES[c.company.country ?? ""]?.name].filter(Boolean).join(", ");
        return (
          <article key={c.id} className={`cand ${c.verdict.toLowerCase()}`}>
            <div className="row between">
              <b>{c.company.name}</b>
              <span className={`badge ${c.verdict.toLowerCase()}`}>{done ? "Approved" : VERDICT_WORD[c.verdict]}</span>
            </div>
            {where && <div className="muted small">{where}</div>}
            {!done && <p>{reasonFor(c)}</p>}
            {done ? (
              <div className="approved">Approved by you at {approved[c.id] ?? "an earlier time"}. Recorded.</div>
            ) : c.verdict === "VERIFIED" ? (
              <button className="primary" disabled={busy === c.id} onClick={() => approve(c)}>Approve this replacement</button>
            ) : null}
            <button className="link" onClick={() => setHow(how === c.id ? null : c.id)}>{how === c.id ? "Hide how we know" : "How we know"}</button>
            {how === c.id && (
              <ul className="how">
                {CHECKS.map((k) => {
                  const r = c.checks.find((x) => x.check === k);
                  const sym = r?.status === "PASS" ? "✓" : r?.status === "FAIL" ? "✗" : "?";
                  const text = r?.status === "PASS" ? PASS_WORD[k] : r?.status === "FAIL" ? FAIL_WORD[k] : UNKNOWN_WORD[k];
                  return <li key={k} className={r?.status?.toLowerCase()}><b>{sym}</b> <span>{CHECK_WORD[k]}</span> <span className="muted">{text}</span></li>;
                })}
                <li className="muted small">Recent news check: not run in this demo.</li>
              </ul>
            )}
          </article>
        );
      })}
      {err && <p className="error">{err}</p>}
    </PanelShell>
  );
}
