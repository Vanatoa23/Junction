import type { ReactNode } from "react";
import type { CheckStatus, Evidence, FootprintKey, Latency, Severity, SourceMode, SupplierStatus, Verdict } from "@secondsource/shared";

export const MODE_HELP: Record<SourceMode, string> = {
  LIVE: "LIVE: a real vendor call made just now.",
  REC: "REC: a recorded real vendor response, replayed.",
  SEED: "SEED: hand-made seed data or a rule-based stand-in. Not live.",
  LOCAL: "LOCAL: produced by our own code against our own TEST page. Not vendor data.",
};

export function ModeBadge({ mode }: { mode: SourceMode | null | undefined }) {
  if (!mode) return null;
  return <span className={`badge b-${mode.toLowerCase()}`} title={MODE_HELP[mode]}>{mode}</span>;
}
export const TestBadge = () => <span className="badge b-test" title="Our own TEST notice page, not a real-world source">TEST</span>;
export const SeededBadge = () => <span className="badge b-seed" title="Seeded or typed in by a user, not fetched from a source">SEEDED</span>;
export const MockBadge = () => <span className="badge b-mock" title="Rendered from the UI's built-in mock layer, not from the backend">MOCK UI</span>;

export function ViaBadge({ via }: { via: "WEBHOOK" | "POLL" | "NEWS" }) {
  const text = via === "POLL" ? "poll" : via === "WEBHOOK" ? "webhook" : "news";
  return <span className="badge b-neutral" title={via === "POLL" ? "Found by our scrape-and-diff poll, not a webhook" : via === "WEBHOOK" ? "Delivered by a signed Context.dev monitor webhook" : "Found by news search"}>{text}</span>;
}

const SUPPLIER_STEPS: SupplierStatus[] = ["PENDING", "RESOLVED", "MONITORED"];
export function StatusPill({ status }: { status: SupplierStatus }) {
  const idx = SUPPLIER_STEPS.indexOf(status);
  const cls = status === "MONITORED" ? "b-good" : status === "RESOLVED" ? "b-accent" : status === "PENDING" ? "b-neutral" : "b-warn";
  const label = status === "AMBIGUOUS" ? "AMBIGUOUS: choose" : status === "UNRESOLVED" ? "UNRESOLVED: add domain" : status;
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className={`badge ${cls}`}>{label}</span>
      {idx >= 0 && <span className="steps" aria-hidden="true">{SUPPLIER_STEPS.map((_, i) => <i key={i} className={i <= idx ? "on" : ""} />)}</span>}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = severity === "CRITICAL" || severity === "HIGH" ? "b-bad" : severity === "MEDIUM" ? "b-warn" : "b-neutral";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

const GLYPH = { CONFIRMED: "✓", INFERRED: "~", UNKNOWN: "?" } as const;
export function KeyChip({ k }: { k: FootprintKey }) {
  return (
    <span className={`chip ${k.state}`} title={`${k.type} ${k.value}: ${k.state}${k.seeded ? ", SEEDED" : ""}${k.sourceUrl ? `, source ${k.sourceUrl}` : ""}`}>
      <span className="t">{k.type}</span>
      {k.state === "UNKNOWN" ? <span>unknown</span> : <span>{k.value}</span>}
      <span className={`state ${k.state}`} aria-label={k.state}>{GLYPH[k.state]}</span>
      {k.seeded && <span className="state" style={{ color: "var(--seed)" }}>S</span>}
    </span>
  );
}
export function KeyChips({ keys }: { keys: FootprintKey[] }) {
  if (!keys.length) return <span className="muted small">no footprint yet</span>;
  return <span className="chips">{keys.map((k, i) => <KeyChip key={`${k.type}${k.value}${i}`} k={k} />)}</span>;
}

export function SourceLink({ url, label }: { url: string; label?: string }) {
  let host = url;
  try { host = new URL(url).host + new URL(url).pathname.replace(/\/$/, ""); } catch { /* keep raw */ }
  return <a className="url" href={url} target="_blank" rel="noreferrer noopener">{label ?? host}<span className="sr"> (opens in a new tab)</span></a>;
}
export function Sources({ urls, empty = "no source URL" }: { urls: string[]; empty?: string }) {
  if (!urls.length) return <span className="muted small">{empty}</span>;
  return <span className="stack" style={{ display: "block" }}>{urls.map((u) => <div key={u}><SourceLink url={u} /></div>)}</span>;
}

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return <span className="muted small">no evidence link</span>;
  return (
    <span style={{ display: "block" }}>
      {evidence.map((e, i) => (
        <div key={i} className="row" style={{ gap: 6 }}>
          <SourceLink url={e.url} /> <ModeBadge mode={e.mode} />
          {e.quote && <span className="small muted">“{e.quote}”</span>}
        </div>
      ))}
    </span>
  );
}

export function CheckPill({ status }: { status: CheckStatus }) {
  const glyph = status === "PASS" ? "✓ " : status === "FAIL" ? "✗ " : "? ";
  return <span className={`badge ${status === "PASS" ? "b-pass" : status === "FAIL" ? "b-fail" : "b-unk"}`}>{glyph}{status}</span>;
}
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const label = verdict === "VERIFIED" ? "✓ VERIFIED" : verdict === "UNVERIFIED" ? "? UNVERIFIED" : "✗ EXCLUDED";
  return <span className={`badge ${verdict === "VERIFIED" ? "b-pass" : verdict === "UNVERIFIED" ? "b-unk" : "b-fail"}`}>{label}</span>;
}

// ---------------------------------------------------------------- time & latency
const clock = (iso: string) => { const d = new Date(iso); return `${d.toLocaleTimeString([], { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`; };
const dur = (ms: number) => (Math.abs(ms) >= 10_000 ? `${(ms / 1000).toFixed(1)} s` : Math.abs(ms) >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`);
export const when = (iso: string) => new Date(iso).toLocaleString([], { hour12: false, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

const STAGES: Array<[keyof Latency, string]> = [["tSource", "t_source"], ["tReceived", "t_received"], ["tClassified", "t_classified"], ["tAlert", "t_alert"]];
export function LatencyChips({ latency }: { latency: Latency }) {
  let prev: number | null = null;
  const chips: ReactNode[] = [];
  for (const [k, label] of STAGES) {
    const v = latency[k];
    if (!v) {
      chips.push(
        <span key={k} className="l na" title={k === "tSource" ? "The source gives no timestamp; we do not invent one." : "Stage not reached yet"}>
          {label} {k === "tSource" ? "n/a" : "pending"}
        </span>,
      );
      continue;
    }
    const t = Date.parse(v);
    chips.push(
      <span key={k} className="l">
        {label} <b>{clock(v)}</b>{prev !== null && <> <span className="muted">+{dur(t - prev)}</span></>}
      </span>,
    );
    prev = t;
  }
  const total = latency.tReceived && latency.tAlert ? Date.parse(latency.tAlert) - Date.parse(latency.tReceived) : null;
  if (total !== null) chips.push(<span key="total" className="l total">received → alert <b>{dur(total)}</b></span>);
  return <div className="lat" aria-label="Per-stage latency">{chips}</div>;
}

export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }
