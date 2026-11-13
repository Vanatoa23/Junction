import { Fragment, useMemo, useState } from "react";
import type { SupplierInput, SupplierRow } from "@secondsource/shared";
import { useStore } from "../lib/store";
import { Empty, KeyChips, ModeBadge, SeededBadge, SourceLink, Sources, StatusPill, when } from "../components/ui";

const SAMPLE = `Nordpack Packaging, nordpack.example, DE
Baltic Carton, , FI
Nord Pack
Karlstad Pack, karlstadpack.example, SE
Unknownia Ltd
Hansa Labels, , DE`;

export function parseSuppliers(text: string): SupplierInput[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\t|;|,/).map((p) => p.trim());
    const name = parts[0] ?? "";
    let domain: string | null = null, country: string | null = null;
    for (const p of parts.slice(1)) {
      if (!p) continue;
      if (/^[A-Za-z]{2}$/.test(p)) country = p.toUpperCase();
      else domain = p.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
    }
    return { name, domain, country };
  }).filter((s) => s.name);
}

export function SuppliersView() {
  const { suppliers, resolve, choose, mode } = useStore();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const parsed = useMemo(() => parseSuppliers(text), [text]);
  const tooMany = parsed.length > 10;
  const counts = useMemo(() => {
    const c = { total: 0, monitored: 0, attention: 0 };
    for (const s of suppliers ?? []) { c.total++; if (s.status === "MONITORED") c.monitored++; if (s.status === "AMBIGUOUS" || s.status === "UNRESOLVED") c.attention++; }
    return c;
  }, [suppliers]);

  const submit = async () => {
    setBusy(true);
    try { await resolve(parsed); setText(""); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <h2>Suppliers</h2>
        <p>Paste 5 to 10 supplier names (optionally with domain and country). Each row moves pending → resolved → monitored, with a footprint of regions, ports, plants and parents. Every key shows its state and where it came from.</p>
      </div>

      <section className="card" aria-labelledby="paste-h">
        <h3 id="paste-h">Paste supplier list</h3>
        <label className="field" htmlFor="paste">One supplier per line: name, domain (optional), country code (optional). Tabs or semicolons work too, so you can paste from a spreadsheet.</label>
        <textarea id="paste" value={text} onChange={(e) => setText(e.target.value)} placeholder={"Acme Packaging, acme.example, FI\nBeta Foils\n..."} spellCheck={false} />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={submit} disabled={busy || parsed.length === 0}>{busy ? "Resolving…" : `Resolve ${parsed.length || ""} supplier${parsed.length === 1 ? "" : "s"}`}</button>
          <button onClick={() => setText(SAMPLE)} type="button">Load sample names</button>
          {tooMany && <span className="badge b-warn" role="status">{parsed.length} rows: the demo flow targets 10 or fewer</span>}
          <span className="note">{mode === "mock" ? "Mock mode: nothing leaves your browser." : "Search queries sent to data providers never include the client name or this list."}</span>
        </div>
      </section>

      <div className="row" style={{ margin: "6px 0 10px", justifyContent: "space-between" }}>
        <div className="row small muted" aria-live="polite">
          <span>{counts.total} suppliers</span><span>·</span><span>{counts.monitored} monitored</span>
          {counts.attention > 0 && <><span>·</span><span className="badge b-warn">{counts.attention} need your choice</span></>}
        </div>
        <div className="legend" aria-label="Footprint key legend">
          <span><span className="state CONFIRMED">✓</span> confirmed</span>
          <span><span className="state INFERRED">~</span> inferred</span>
          <span><span className="state UNKNOWN">?</span> unknown</span>
          <span><span className="state" style={{ color: "var(--seed)" }}>S</span> seeded</span>
        </div>
      </div>

      {suppliers === null ? <Empty>Loading suppliers…</Empty> : suppliers.length === 0 ? <Empty>No suppliers yet. Paste a list above.</Empty> : (
        <div className="card scroll" style={{ padding: 0 }}>
          <table>
            <caption className="sr">Supplier grid</caption>
            <thead>
              <tr><th scope="col">Supplier</th><th scope="col">Status</th><th scope="col">Data</th><th scope="col">Footprint</th><th scope="col">Sources</th></tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <Fragment key={s.edgeId}>
                  <Row s={s} expanded={open === s.edgeId || s.status === "AMBIGUOUS" || s.status === "UNRESOLVED"} onToggle={() => setOpen(open === s.edgeId ? null : s.edgeId)} />
                  {(open === s.edgeId || s.status === "AMBIGUOUS" || s.status === "UNRESOLVED") && (
                    <tr className={open === s.edgeId ? "sel" : ""}>
                      <td colSpan={5}><Detail s={s} onChoose={(body) => choose(s.edgeId, body)} /></td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Row({ s, expanded, onToggle }: { s: SupplierRow; expanded: boolean; onToggle: () => void }) {
  return (
    <tr className={expanded ? "sel" : ""}>
      <td>
        <button className="ghost" style={{ border: 0, padding: 0, textAlign: "left", fontWeight: 700, color: "inherit" }} onClick={onToggle} aria-expanded={expanded} aria-label={`${s.input.name}: ${expanded ? "hide" : "show"} details`}>
          <span aria-hidden="true">{expanded ? "▾" : "▸"} </span>{s.company?.name ?? s.input.name}
        </button>
        <div className="small muted">{s.company?.legalName ?? "unresolved"}{(s.company?.domain ?? s.input.domain) ? ` · ${s.company?.domain ?? s.input.domain}` : ""}{(s.company?.country ?? s.input.country) ? ` · ${s.company?.country ?? s.input.country}` : ""}</div>
      </td>
      <td><StatusPill status={s.status} /></td>
      <td><span className="row" style={{ gap: 4 }}><ModeBadge mode={s.mode} />{s.seeded && <SeededBadge />}</span></td>
      <td><KeyChips keys={s.footprint} /></td>
      <td className="small">{s.sourceUrls.length ? <Sources urls={s.sourceUrls.slice(0, 2)} /> : <span className="muted">{s.seeded ? "SEEDED: no source URL" : "none yet"}</span>}</td>
    </tr>
  );
}

function Detail({ s, onChoose }: { s: SupplierRow; onChoose: (b: { companyId?: string; domain?: string }) => Promise<void> }) {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (b: { companyId?: string; domain?: string }) => { setBusy(true); try { await onChoose(b); } finally { setBusy(false); } };
  return (
    <div className="stack" style={{ padding: "4px 2px 8px" }}>
      {s.status === "AMBIGUOUS" && (
        <div role="group" aria-label={`Choose the right match for ${s.input.name}`}>
          <h3>Which one did you mean? <span className="muted small">resolver score {s.resolveScore?.toFixed(2)} is between 0.60 and 0.85</span></h3>
          <div className="grid2" style={{ marginTop: 8 }}>
            {s.options.map((o, i) => (
              <div key={(o.companyId ?? "") + i} className="card" style={{ margin: 0 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><b>{o.name}</b><span className="badge b-neutral">score {o.score.toFixed(2)}</span></div>
                <div className="small muted">{o.domain ?? "no domain"} · {o.country ?? "?"}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <ModeBadge mode={o.mode} />
                  <button className="primary" disabled={busy || (!o.companyId && !o.domain)} onClick={() => run(o.companyId ? { companyId: o.companyId } : { domain: o.domain ?? undefined })}>This one</button>
                </div>
                {o.sourceUrls.length > 0 && <div className="small" style={{ marginTop: 6 }}><Sources urls={o.sourceUrls} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {s.status === "UNRESOLVED" && (
        <div>
          <h3>Could not resolve “{s.input.name}” <span className="muted small">score {s.resolveScore?.toFixed(2) ?? "?"} is below 0.60</span></h3>
          <div className="row" style={{ marginTop: 8, maxWidth: 520 }}>
            <label className="sr" htmlFor={`dom-${s.edgeId}`}>Domain for {s.input.name}</label>
            <input id={`dom-${s.edgeId}`} type="text" placeholder="company domain, e.g. acme.example" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ flex: 1 }} />
            <button className="primary" disabled={busy || !domain.trim()} onClick={() => run({ domain: domain.trim() })}>Resolve with domain</button>
          </div>
        </div>
      )}
      {s.footprint.length > 0 && (
        <div className="scroll">
          <table>
            <caption className="sr">Footprint keys for {s.input.name}</caption>
            <thead><tr><th scope="col">Type</th><th scope="col">Value</th><th scope="col">State</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {s.footprint.map((k, i) => (
                <tr key={i}>
                  <td className="mono">{k.type}</td>
                  <td className="mono">{k.state === "UNKNOWN" ? <span className="muted">unknown (no data)</span> : k.value}</td>
                  <td><span className={`state ${k.state}`}>{k.state}</span> {k.seeded && <SeededBadge />}</td>
                  <td className="small">
                    {k.sourceUrl ? <SourceLink url={k.sourceUrl} /> : k.state === "UNKNOWN" ? <span className="muted">none: unknown never counts as a pass</span> : <span className="muted">SEEDED: no source URL</span>}
                    {k.sourceQuote && <div className="muted">“{k.sourceQuote}”</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dl className="kv">
        <dt>Category</dt><dd>{s.company?.category ?? "n/a"}</dd>
        <dt>Resolver score</dt><dd>{s.resolveScore !== null ? s.resolveScore.toFixed(2) : "pending"}</dd>
        <dt>Monitors</dt>
        <dd>{s.monitors.length ? s.monitors.map((m) => (<span key={m.url} className="row" style={{ gap: 6 }}><span className="badge b-neutral">{m.kind === "POLL" ? "poll" : "webhook"}</span><SourceLink url={m.url} /></span>)) : <span className="muted">none armed yet</span>}</dd>
        <dt>Updated</dt><dd>{when(s.updatedAt)}</dd>
      </dl>
    </div>
  );
}
