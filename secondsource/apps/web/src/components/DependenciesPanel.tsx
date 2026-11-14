import { useEffect, useState, type FormEvent } from "react";
import { PORTS, placeLabel, type MapSupplier, type SaveDependencyRequest, type SupplierDependency, type SupplierRow } from "@secondsource/shared";
import { api } from "../lib/api";
import { Section } from "./Ui";

const confidence = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };
const kinds = { PORT: "Port", PLANT: "Plant", SUPPLIER: "Upstream supplier" };
const today = () => new Date().toISOString().slice(0, 10);
const empty = (): SaveDependencyRequest => ({
  kind: "PORT", name: "", matchKey: "", parentId: null, source: "", sourceUrl: null, confidence: "HIGH", verifiedOn: today(),
});

function Evidence({ link }: { link: SupplierDependency }) {
  return (
    <div className="muted small">
      {link.sourceUrl ? <a href={link.sourceUrl} target="_blank" rel="noreferrer">{link.source}</a> : link.source}
      {" · "}{confidence[link.confidence]} confidence{" · Verified "}<time dateTime={link.verifiedOn}>{link.verifiedOn}</time>
    </div>
  );
}

export function DependenciesPanel({ supplier, row, onChange }: { supplier: MapSupplier; row: SupplierRow; onChange: () => Promise<void> }) {
  const [links, setLinks] = useState<SupplierDependency[]>([]);
  const [form, setForm] = useState<SaveDependencyRequest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const edgeId = supplier.edgeId;

  useEffect(() => {
    let active = true;
    void api.dependencies(edgeId).then((result) => {
      if (active) setLinks(result.dependencies);
    }).catch((err: Error) => {
      if (active) setError(err.message);
    });
    return () => { active = false; };
  }, [edgeId]);

  const byId = new Map(links.map((link) => [link.id, link]));
  function path(link: SupplierDependency): string {
    const parent = link.parentId && byId.get(link.parentId);
    return parent ? `${path(parent)} → ${link.name}` : link.name;
  }

  const suggested = row.footprint.filter((key) =>
    (key.type === "PORT" || key.type === "PLANT") && key.state !== "UNKNOWN" &&
    !links.some((link) => !link.parentId && link.kind === key.type && link.matchKey === key.value.toUpperCase()),
  );
  const update = (value: Partial<SaveDependencyRequest>) => setForm((current) => current && { ...current, ...value });

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.saveDependency(edgeId, form);
      setLinks(result.dependencies);
      setForm(null);
      await onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(id: string) {
    setBusy(true);
    setError("");
    try {
      await api.removeDependency(edgeId, id);
      const result = await api.dependencies(edgeId);
      setLinks(result.dependencies);
      setRemove(null);
      setForm(null);
      await onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Dependencies">
      <p className="muted small">Confirm the plants, ports, and upstream suppliers you rely on through this supplier. Links stay in your workspace.</p>
      {supplier.exposures.map((exposure) => (
        <div className="callout" key={`${exposure.incidentId}-${exposure.path.at(-1)!.id}`}>
          <b>{exposure.headline}</b>
          <div className="small">{[supplier.name, ...exposure.path.map((step) => step.name)].join(" → ")}</div>
          {exposure.path.map((step) => <div key={step.id}><b className="small">{step.name}</b><Evidence link={step} /></div>)}
        </div>
      ))}

      {links.map((link) => (
        <div className="result" key={link.id}>
          <b>{path(link)}</b>
          <div className="muted small">{kinds[link.kind]}{link.kind !== "SUPPLIER" && ` · ${link.matchKey}`}</div>
          <Evidence link={link} />
          {remove === link.id ? (
            <div className="row">
              <span className="small">Remove this link and its dependent links?</span>
              <button type="button" className="small" disabled={busy} onClick={() => void removeLink(link.id)}>Remove</button>
              <button type="button" className="small" disabled={busy} onClick={() => setRemove(null)}>Cancel</button>
            </div>
          ) : (
            <div className="row">
              <button type="button" className="link" onClick={() => { setError(""); setForm(link); }}>Update evidence</button>
              <button type="button" className="link subtle" onClick={() => setRemove(link.id)}>Remove</button>
            </div>
          )}
        </div>
      ))}

      {!form && suggested.map((key) => (
        <div className="choice" key={`${key.type}:${key.value}`}>
          <div><b>{placeLabel(key.type, key.value)}</b><div className="muted small">Suggested for review</div></div>
          <button type="button" className="small" onClick={() => setForm({
            ...empty(), kind: key.type as "PORT" | "PLANT", name: placeLabel(key.type, key.value), matchKey: key.value,
          })}>Review</button>
        </div>
      ))}

      {!form && <button type="button" className="link strong" onClick={() => { setError(""); setForm(empty()); }}>+ Add dependency</button>}
      {form && (
        <form className="result" onSubmit={save}>
          <label className="field"><span>Type</span>
            <select value={form.kind} disabled={"id" in form} onChange={(event) => update({ kind: event.target.value as SaveDependencyRequest["kind"], name: "", matchKey: "" })}>
              {Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="field"><span>Depends on this link through</span>
            <select value={form.parentId ?? ""} disabled={"id" in form} onChange={(event) => update({ parentId: event.target.value || null })}>
              <option value="">{supplier.name}</option>
              {links.filter((link) => link.kind === "SUPPLIER").map((link) => <option key={link.id} value={link.id}>{path(link)}</option>)}
            </select>
          </label>
          {form.kind !== "SUPPLIER" && (
            <label className="field"><span>{form.kind === "PORT" ? "Port code (UN/LOCODE)" : "Plant identifier"}</span>
              <input required maxLength={140} list={form.kind === "PORT" ? `ports-${edgeId}` : undefined} value={form.matchKey} disabled={"id" in form}
                onChange={(event) => {
                  const matchKey = event.target.value;
                  const port = form.kind === "PORT" && PORTS[matchKey.toUpperCase()];
                  update({ matchKey, ...(port ? { name: `Port of ${port.name}` } : {}) });
                }} />
              <datalist id={`ports-${edgeId}`}>{Object.entries(PORTS).map(([code, port]) => <option key={code} value={code}>{port.name}</option>)}</datalist>
            </label>
          )}
          <label className="field"><span>Name</span><input required maxLength={140} value={form.name} disabled={form.kind === "SUPPLIER" && "id" in form} onChange={(event) => update({ name: event.target.value })} /></label>
          <label className="field"><span>Evidence source</span>
            <input required maxLength={300} value={form.source} placeholder="For example, supplier confirmation or purchase order" onChange={(event) => update({ source: event.target.value })} />
          </label>
          <label className="field"><span>Source link (optional)</span>
            <input type="url" value={form.sourceUrl ?? ""} onChange={(event) => update({ sourceUrl: event.target.value || null })} />
          </label>
          <div className="row">
            <label className="field"><span>Confidence</span>
              <select value={form.confidence} onChange={(event) => update({ confidence: event.target.value as SaveDependencyRequest["confidence"] })}>
                {Object.entries(confidence).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="field"><span>Last verified</span><input type="date" required max={today()} value={form.verifiedOn} onChange={(event) => update({ verifiedOn: event.target.value })} /></label>
          </div>
          <div className="row sect">
            <button type="submit" className="primary small" disabled={busy}>Save evidence</button>
            <button type="button" className="small" disabled={busy} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </Section>
  );
}
