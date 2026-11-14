import { useEffect, useState } from "react";
import { AddPanel } from "./components/AddPanel";
import { AltPanel } from "./components/AltPanel";
import { MapView } from "./components/MapView";
import { SupplierPanel } from "./components/SupplierPanel";
import { TestControl } from "./components/TestControl";
import { useData } from "./lib/data";
import { RISK_COLOR, RISK_HELP } from "./lib/words";
import { AlertsView } from "./views/AlertsView";
import { SuppliersView } from "./views/SuppliersView";

type View = "map" | "suppliers" | "alerts";
type Panel = { kind: "supplier"; edgeId: string } | { kind: "add" } | { kind: "alt"; incidentId: string; edgeId: string } | null;

const viewFromHash = (): View => {
  const h = window.location.hash.replace("#/", "");
  return h === "suppliers" || h === "alerts" ? h : "map";
};

export function App() {
  const { map, merged, error, live } = useData();
  const [view, setView] = useState<View>(viewFromHash);
  const [panel, setPanel] = useState<Panel>(null);
  const [incident, setIncident] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setView(viewFromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (v: View) => { window.location.hash = `#/${v}`; setPanel(null); };

  const incidents = map?.incidents ?? [];
  const newest = incidents[0] ?? null;

  const panelNode = panel && (
    panel.kind === "add" ? <AddPanel onClose={() => setPanel(null)} onOpen={(edgeId) => setPanel({ kind: "supplier", edgeId })} /> :
    panel.kind === "supplier" ? <SupplierPanel edgeId={panel.edgeId} onClose={() => setPanel(null)} onFindReplacement={(incidentId, edgeId) => setPanel({ kind: "alt", incidentId, edgeId })} /> :
    <AltPanel incidentId={panel.incidentId} edgeId={panel.edgeId} onClose={() => setPanel(null)} />
  );

  return (
    <div className="app">
      <header className="top">
        <div className="brand"><span className="logo" aria-hidden /> SecondSource</div>
        <nav>
          {(["map", "suppliers", "alerts"] as const).map((v) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => go(v)}>
              {v === "map" ? "Map" : v === "suppliers" ? "Suppliers" : "Alerts"}
              {v === "alerts" && incidents.length > 0 && <span className="count">{incidents.length}</span>}
            </button>
          ))}
        </nav>
        <div className="grow" />
        <span className={`live ${live ? "on" : ""}`} title={live ? "Updating live" : "Reconnecting…"}><i /> {live ? "Live" : "Reconnecting"}</span>
        <button className="primary" onClick={() => setPanel({ kind: "add" })}>+ Add supplier</button>
      </header>

      {error && !map && <div className="banner">We cannot reach the server right now. {error}</div>}

      {view === "map" && (
        <div className="stage">
          {newest && (
            <div className="alertbar">
              <span className="dotred" />
              <div>
                <b>{newest.headline}.</b>{" "}
                {newest.affected.length ? `${newest.affected.length} of your suppliers ${newest.affected.length === 1 ? "is" : "are"} affected.` : "No direct supplier alerts."}
                {newest.exposureCount > 0 && ` ${newest.exposureCount} ${newest.exposureCount === 1 ? "supplier has" : "suppliers have"} exposure through recorded dependencies.`}
              </div>
              <button className="small" onClick={() => { setIncident(newest.id); go("alerts"); }}>See what to do</button>
            </div>
          )}
          {map ? (
            <MapView data={map} selectedId={panel?.kind === "supplier" ? merged[panel.edgeId] ?? panel.edgeId : null} onSelect={(id) => setPanel(id ? { kind: "supplier", edgeId: id } : null)} />
          ) : <div className="map loading">Loading your map…</div>}

          {map && map.suppliers.length === 0 && (
            <div className="hint"><b>Your map is empty.</b><p className="muted">Add the companies you buy from and they appear here.</p><button className="primary" onClick={() => setPanel({ kind: "add" })}>Add your first supplier</button></div>
          )}

          {map?.suppliers.some((supplier) => supplier.risk.coverage === "LIMITED") && (
            <div className="coverage-key"><i aria-hidden /> Limited coverage</div>
          )}
          <div className="legend">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((l) => <span key={l}><i style={{ background: RISK_COLOR[l] }} /> {RISK_HELP[l]}</span>)}
            <div className="muted small">Lines go to your direct suppliers. Their own suppliers are checked in the background and counted in the colour.</div>
          </div>
          <TestControl />
          {panelNode}
        </div>
      )}

      {view !== "map" && (
        <div className="split">
          {view === "suppliers" ? (
            <SuppliersView selected={panel?.kind === "supplier" ? merged[panel.edgeId] ?? panel.edgeId : null} onSelect={(id) => setPanel({ kind: "supplier", edgeId: id })} onAdd={() => setPanel({ kind: "add" })} />
          ) : (
            <AlertsView selected={incident} onSelect={(id) => { setIncident(id); setPanel(null); }} hideDetail={panel !== null}
              onFindReplacement={(incidentId, edgeId) => setPanel({ kind: "alt", incidentId, edgeId })} onOpenSupplier={(edgeId) => setPanel({ kind: "supplier", edgeId })} />
          )}
          {panelNode}
        </div>
      )}
    </div>
  );
}
