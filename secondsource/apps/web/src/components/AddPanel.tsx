import { useMemo, useState } from "react";
import { COUNTRIES, type Criticality } from "@secondsource/shared";
import { api } from "../lib/api";
import { useData } from "../lib/data";
import { CRITICALITY_WORD, foundLines, statusWord } from "../lib/words";
import { PanelShell } from "./Ui";

/**
 * Add suppliers. Only the name is required. Everything else is an optional chip that opens one small field.
 * After saving, shows what we found and what we could not find, live.
 */
type Chip = "website" | "country" | "city" | "supplies" | "importance" | "spend" | "lead" | "contact" | "notes";
const CHIPS: Array<[Chip, string]> = [
  ["website", "Website"], ["country", "Country"], ["city", "City"], ["supplies", "What they supply"], ["importance", "How important"],
  ["spend", "Yearly spend"], ["lead", "Usual lead time"], ["contact", "Contact"], ["notes", "Notes"],
];

export function AddPanel({ onClose, onOpen }: { onClose: () => void; onOpen: (edgeId: string) => void }) {
  const { rows, map, reload } = useData();
  const [tab, setTab] = useState<"one" | "list">("one");
  const [name, setName] = useState("");
  const [open, setOpen] = useState<Set<Chip>>(new Set());
  const [v, setV] = useState<Record<string, string>>({});
  const [crit, setCrit] = useState<Criticality | null>(null);
  const [list, setList] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const countries = useMemo(() => Object.entries(COUNTRIES).sort((a, b) => a[1].name.localeCompare(b[1].name)), []);

  const set = (k: string, val: string) => setV((x) => ({ ...x, [k]: val }));
  const toggle = (c: Chip) => setOpen((o) => { const n = new Set(o); n.has(c) ? n.delete(c) : n.add(c); return n; });
  const num = (s: string | undefined) => (s && s.trim() !== "" && Number.isFinite(Number(s)) ? Number(s) : null);

  const submit = async (suppliers: Array<Record<string, unknown> & { name: string }>) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.addSuppliers(suppliers);
      setAdded(r.suppliers.map((s) => s.edgeId));
      setName(""); setV({}); setOpen(new Set()); setCrit(null); setList("");
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveOne = () =>
    submit([{
      name: name.trim(), domain: v.website?.trim() || null, country: v.country || null, city: v.city?.trim() || null,
      supplies: v.supplies?.trim() || null, criticality: crit, annualSpendEur: num(v.spend), leadTimeDays: num(v.lead),
      contact: v.contact?.trim() || null, notes: v.notes?.trim() || null,
    }]);

  const saveList = () =>
    submit(
      list.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
        const [n, site, country] = l.split(/\t|;|,/).map((p) => p.trim());
        return { name: n ?? "", domain: site || null, country: country || null };
      }).filter((s) => s.name),
    );

  return (
    <PanelShell title="Add suppliers" sub="Only the name is needed. We look up the rest." onClose={onClose}>
      <div className="tabs small">
        <button className={tab === "one" ? "on" : ""} onClick={() => setTab("one")}>Add one</button>
        <button className={tab === "list" ? "on" : ""} onClick={() => setTab("list")}>Paste a list</button>
      </div>

      {tab === "one" ? (
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) void saveOne(); }}>
          <label className="field">
            <span>Company name</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Nordpack Packaging" />
          </label>
          <div className="muted small" style={{ margin: "10px 0 6px" }}>Add more details if you like:</div>
          <div className="chips">
            {CHIPS.map(([c, label]) => (
              <button type="button" key={c} className={`chip${open.has(c) ? " on" : ""}`} onClick={() => toggle(c)}>{open.has(c) ? "– " : "+ "}{label}</button>
            ))}
          </div>
          {open.has("website") && <label className="field"><span>Website</span><input value={v.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="www.example.com" /></label>}
          {open.has("country") && (
            <label className="field"><span>Country</span>
              <select value={v.country ?? ""} onChange={(e) => set("country", e.target.value)}>
                <option value="">Choose…</option>
                {countries.map(([code, c]) => <option key={code} value={code}>{c.name}</option>)}
              </select>
            </label>
          )}
          {open.has("city") && <label className="field"><span>City</span><input value={v.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="For example: Hamburg" /></label>}
          {open.has("supplies") && <label className="field"><span>What they supply</span><input value={v.supplies ?? ""} onChange={(e) => set("supplies", e.target.value)} placeholder="Cartons, enzymes, labels…" /></label>}
          {open.has("importance") && (
            <div className="field"><span>How important are they?</span>
              <div className="seg">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((c) => <button type="button" key={c} className={crit === c ? "on" : ""} onClick={() => setCrit(crit === c ? null : c)}>{CRITICALITY_WORD[c]}</button>)}
              </div>
            </div>
          )}
          {open.has("spend") && <label className="field"><span>Yearly spend (€)</span><input inputMode="numeric" value={v.spend ?? ""} onChange={(e) => set("spend", e.target.value)} placeholder="250000" /></label>}
          {open.has("lead") && <label className="field"><span>Usual lead time (days)</span><input inputMode="numeric" value={v.lead ?? ""} onChange={(e) => set("lead", e.target.value)} placeholder="14" /></label>}
          {open.has("contact") && <label className="field"><span>Contact</span><input value={v.contact ?? ""} onChange={(e) => set("contact", e.target.value)} placeholder="Name or email" /></label>}
          {open.has("notes") && <label className="field"><span>Notes</span><textarea rows={3} value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></label>}
          <button className="primary wide" type="submit" disabled={busy || !name.trim()}>Add supplier</button>
        </form>
      ) : (
        <div>
          <label className="field">
            <span>One supplier per line</span>
            <textarea rows={8} value={list} onChange={(e) => setList(e.target.value)} placeholder={"Nordpack Packaging, www.nordpack.com, DE\nBaltic Carton\nHansa Labels, , DE"} />
          </label>
          <div className="muted small">You can add a website and a two-letter country code after each name, separated by commas. Both are optional.</div>
          <button className="primary wide" disabled={busy || !list.trim()} onClick={saveList}>Add these suppliers</button>
        </div>
      )}
      {err && <p className="error">{err}</p>}

      {added.length > 0 && (
        <section className="sect">
          <h3>What we found</h3>
          {added.map((id) => {
            const row = rows.find((r) => r.edgeId === id);
            const ms = map?.suppliers.find((x) => x.edgeId === id);
            if (!row) return null;
            const lines = foundLines(row);
            const working = row.status === "PENDING";
            return (
              <div className="result" key={id}>
                <div className="row between"><b>{ms?.name ?? row.input.name}</b><span className="muted small">{statusWord(row.status)}</span></div>
                {working ? <div className="muted small">Looking for its website, location and where it ships from…</div> : (
                  <>
                    {lines.found.length > 0 && <div className="found small"><b>Found:</b> {lines.found.join(", ")}.</div>}
                    {lines.missing.length > 0 && <div className="missing small"><b>Could not find:</b> {lines.missing.join(", ")}.</div>}
                    {row.status === "AMBIGUOUS" && <div className="small">Two companies match. Open it to choose.</div>}
                    {row.status === "UNRESOLVED" && <div className="small">We could not find it. Open it to add a website.</div>}
                    <button className="link" onClick={() => onOpen(id)}>Open</button>
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}
    </PanelShell>
  );
}
