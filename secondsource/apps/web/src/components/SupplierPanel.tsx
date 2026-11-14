import { useState } from "react";
import { COUNTRIES } from "@secondsource/shared";
import { api } from "../lib/api";
import { useData } from "../lib/data";
import { CRITICALITY_WORD, foundLines, statusWord } from "../lib/words";
import { DependenciesPanel } from "./DependenciesPanel";
import { PanelShell, Score, Section } from "./Ui";
import type { MapSupplier } from "@secondsource/shared";

/** One supplier: where it is, how risky and why, what we found, what you told us, and what to do about an alert. */
export function SupplierPanel({ edgeId, onClose, onFindReplacement }: { edgeId: string; onClose: () => void; onFindReplacement: (incidentId: string, edgeId: string) => void }) {
  const { map, rows, merged, reload } = useData();
  const currentId = merged[edgeId] ?? edgeId;
  const s = map?.suppliers.find((x) => x.edgeId === currentId);
  const row = rows.find((r) => r.edgeId === currentId);
  const [all, setAll] = useState(false);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  if (!s) return <PanelShell title="Supplier" onClose={onClose}><p className="muted">This supplier is no longer on your list.</p></PanelShell>;

  const where = s.precision === "CITY" ? [s.city, COUNTRIES[s.country ?? ""]?.name].filter(Boolean).join(", ") : s.country ? `${COUNTRIES[s.country]?.name ?? s.country} (approximate location)` : "Location not known yet";
  const { found, missing } = foundLines(row);
  const reasons = all ? s.risk.reasons : s.risk.reasons.slice(0, 3);

  const choose = async (body: { companyId?: string; domain?: string }) => {
    setBusy(true);
    setErr(null);
    try {
      await api.choose(currentId, body);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell title={s.name} sub={`${where} · ${statusWord(s.status)}`} onClose={onClose}>
      {s.status === "AMBIGUOUS" && row && (
        <Section title="Which one did you mean?">
          {row.options.map((o) => (
            <div className="choice" key={o.domain ?? o.name}>
              <div><b>{o.name}</b><div className="muted small">{[o.domain, o.country].filter(Boolean).join(" · ")}</div></div>
              <button className="primary small" disabled={busy} onClick={() => choose(o.companyId ? { companyId: o.companyId } : { domain: o.domain ?? undefined })}>This one</button>
            </div>
          ))}
        </Section>
      )}
      {s.status === "UNRESOLVED" && (
        <Section title="We could not find it">
          <p className="muted">Add its website and we will look again.</p>
          <div className="row">
            <input value={domain} placeholder="www.example.com" onChange={(e) => setDomain(e.target.value)} />
            <button className="primary small" disabled={busy || !domain.trim()} onClick={() => choose({ domain: domain.trim() })}>Look again</button>
          </div>
        </Section>
      )}
      {err && <p className="error">{err}</p>}

      {s.alert && (
        <div className="callout">
          <b>{s.alert.headline}</b>
          <div className="muted">This affects {s.name}.</div>
          <button className="primary" onClick={() => onFindReplacement(s.alert!.incidentId, s.edgeId)}>Find a replacement</button>
        </div>
      )}

      {s.status === "MONITORED" || s.status === "RESOLVED" ? (
        <Section title="Risk">
          <Score risk={s.risk} />
          <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          {s.risk.reasons.length > 3 && <button className="link" onClick={() => setAll(!all)}>{all ? "Show less" : "Show all reasons"}</button>}
          <div className="muted small">
            {s.risk.coverage === "GOOD" ? `Based on ${s.name} and ${s.risk.deeperChecked} of its own suppliers.` : "Coverage is limited. Some plants, ports, or upstream links may be missing or out of date."}
          </div>
        </Section>
      ) : null}

      {row?.company && <DependenciesPanel key={s.edgeId} supplier={s} row={row} onChange={reload} />}

      {(found.length > 0 || missing.length > 0) && (
        <Section title="What we found">
          {found.length > 0 && <p className="found"><b>Found:</b> {found.join(", ")}.</p>}
          {missing.length > 0 && <p className="missing"><b>Could not find:</b> {missing.join(", ")}.</p>}
        </Section>
      )}

      {s.sites.length > 0 && (
        <Section title="Known facilities">
          <p>{s.sites.reduce((n, x) => n + x.count, 0)} sites: {s.sites.map((x) => `${COUNTRIES[x.country]?.name ?? x.country} ${x.count}`).join(", ")}.</p>
          <p className="muted small">From a public supplier disclosure. Only the country is known, so the dots on the map are approximate.{s.anonymised ? " The company name is hidden in the dataset, so it shows as a code." : ""}</p>
        </Section>
      )}

      <Section title="What you told us">
        {editing ? (
          <DetailsForm s={s} contact={row?.input.contact ?? null} notes={row?.input.notes ?? null} onDone={async () => { setEditing(false); await reload(); }} />
        ) : (<>
        {s.supplies || s.criticality || s.annualSpendEur != null || s.leadTimeDays != null || row?.input.contact || row?.input.notes ? (
          <dl className="facts">
            {s.supplies && (<><dt>Supplies</dt><dd>{s.supplies}</dd></>)}
            {s.criticality && (<><dt>How important</dt><dd>{CRITICALITY_WORD[s.criticality]}</dd></>)}
            {s.annualSpendEur != null && (<><dt>Yearly spend</dt><dd>€{s.annualSpendEur.toLocaleString("en")}</dd></>)}
            {s.leadTimeDays != null && (<><dt>Usual lead time</dt><dd>{s.leadTimeDays} days</dd></>)}
            {row?.input.contact && (<><dt>Contact</dt><dd>{row.input.contact}</dd></>)}
            {row?.input.notes && (<><dt>Notes</dt><dd>{row.input.notes}</dd></>)}
          </dl>
        ) : (
          <p className="muted">Nothing yet. Details are optional; they help us rank replacements later.</p>
        )}
        <button className="link" onClick={() => setEditing(true)}>{s.supplies || s.criticality || s.annualSpendEur != null || s.leadTimeDays != null ? "Edit details" : "Add details"}</button>
        </>)}
      </Section>
    </PanelShell>
  );
}

/** Optional facts about a supplier. Empty fields clear the value. */
function DetailsForm({ s, contact, notes, onDone }: { s: MapSupplier; contact: string | null; notes: string | null; onDone: () => void }) {
  const [f, setF] = useState({ city: s.city ?? "", supplies: s.supplies ?? "", spend: s.annualSpendEur?.toString() ?? "", lead: s.leadTimeDays?.toString() ?? "", contact: contact ?? "", notes: notes ?? "" });
  const [crit, setCrit] = useState(s.criticality);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));
  const save = async () => {
    setBusy(true);
    try {
      await api.updateDetails(s.edgeId, { city: f.city.trim() || null, supplies: f.supplies.trim() || null, criticality: crit, annualSpendEur: num(f.spend), leadTimeDays: num(f.lead) === null ? null : Math.round(num(f.lead)!), contact: f.contact.trim() || null, notes: f.notes.trim() || null });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  const field = (label: string, k: keyof typeof f, ph = "") => (
    <label className="field"><span>{label}</span><input value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  );
  return (
    <div>
      {field("City", "city", "For example: Hamburg")}
      {field("What they supply", "supplies", "Cartons, enzymes, labels…")}
      <div className="field"><span>How important are they?</span>
        <div className="seg">{(["LOW", "MEDIUM", "HIGH"] as const).map((c) => <button type="button" key={c} className={crit === c ? "on" : ""} onClick={() => setCrit(crit === c ? null : c)}>{CRITICALITY_WORD[c]}</button>)}</div>
      </div>
      {field("Yearly spend (€)", "spend", "250000")}
      {field("Usual lead time (days)", "lead", "14")}
      {field("Contact", "contact")}
      <label className="field"><span>Notes</span><textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
      {err && <p className="error">{err}</p>}
      <div className="row" style={{ marginTop: 12 }}><button className="primary" disabled={busy} onClick={save}>Save</button><button onClick={onDone} disabled={busy}>Cancel</button></div>
    </div>
  );
}
