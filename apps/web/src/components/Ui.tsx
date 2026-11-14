import type { ReactNode } from "react";
import type { RiskLevel, SupplierRisk } from "@secondsource/shared";
import { RISK_COLOR, RISK_WORD } from "../lib/words";

export function RiskPill({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span className="pill" style={{ "--c": RISK_COLOR[level] } as React.CSSProperties}>
      <i /> {RISK_WORD[level]}
      {score !== undefined && <span className="muted"> {score}</span>}
    </span>
  );
}

export function Score({ risk }: { risk: SupplierRisk }) {
  return (
    <div className="score" style={{ "--c": RISK_COLOR[risk.level] } as React.CSSProperties}>
      <div className="score-num">{risk.score}</div>
      <div>
        <div className="score-word">{RISK_WORD[risk.level]}</div>
        <div className="muted small">{risk.score} of 100</div>
      </div>
    </div>
  );
}

export function PanelShell({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  return (
    <aside className="panel" role="dialog" aria-label={title}>
      <header>
        <div>
          <h2>{title}</h2>
          {sub && <div className="muted">{sub}</div>}
        </div>
        <button className="icon" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="panel-body">{children}</div>
    </aside>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sect">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
