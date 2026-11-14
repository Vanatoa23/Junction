import { COUNTRIES } from "@secondsource/shared";
import { useData } from "../lib/data";
import { CRITICALITY_WORD, statusWord } from "../lib/words";
import { RiskPill } from "../components/Ui";

/** A plain list of direct suppliers, riskiest first. Click one to open it. */
export function SuppliersView({ selected, onSelect, onAdd }: { selected: string | null; onSelect: (id: string) => void; onAdd: () => void }) {
  const { map } = useData();
  const list = [...(map?.suppliers ?? [])].sort((a, b) => b.risk.score - a.risk.score);
  const unplaced = list.filter((s) => s.lat == null).length;

  return (
    <main className="list-page wide-list">
      <div className="row between">
        <h1>Suppliers</h1>
        <button className="primary" onClick={onAdd}>+ Add supplier</button>
      </div>
      <p className="muted lead">The companies you buy from directly, riskiest first. We also look at their own suppliers in the background and include them in the score.</p>
      {list.length === 0 ? (
        <div className="empty"><b>No suppliers yet.</b><p className="muted">Add the companies you work with. Only the name is needed.</p><button className="primary" onClick={onAdd}>Add your first supplier</button></div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Supplier</th><th>Where</th><th>Supplies</th><th>Status</th><th>Risk</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.edgeId} className={s.edgeId === selected ? "on" : ""} onClick={() => onSelect(s.edgeId)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect(s.edgeId)}>
                <td><b>{s.name}</b>{s.alert && <div className="alert-tag">{s.alert.headline}</div>}</td>
                <td>{[s.city, COUNTRIES[s.country ?? ""]?.name].filter(Boolean).join(", ") || <span className="muted">Not known yet</span>}</td>
                <td>{s.supplies ?? s.category ?? <span className="muted">-</span>}{s.criticality && <div className="muted small">{CRITICALITY_WORD[s.criticality]}</div>}</td>
                <td>{statusWord(s.status)}</td>
                <td>{s.status === "MONITORED" || s.status === "RESOLVED" ? <RiskPill level={s.risk.level} score={s.risk.score} /> : <span className="muted">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {unplaced > 0 && <p className="muted small">{unplaced} supplier{unplaced > 1 ? "s are" : " is"} not on the map yet. Add a country or city to see {unplaced > 1 ? "them" : "it"}.</p>}
    </main>
  );
}
