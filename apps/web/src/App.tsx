import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./lib/store";
import type { ApiMode } from "./lib/api";
import { MockBadge, ModeBadge } from "./components/ui";
import { SuppliersView } from "./views/Suppliers";
import { FeedView } from "./views/Feed";
import { IncidentView } from "./views/Incident";
import { AlternativesView } from "./views/Alternatives";
import { TestPageView } from "./views/TestPage";

type Route =
  | { name: "suppliers" } | { name: "feed" } | { name: "test" }
  | { name: "incident"; id: string | null }
  | { name: "alternatives"; incidentId: string | null; edgeId: string | null };

function parse(hash: string): Route {
  const [, a, b, c] = hash.replace(/^#/, "").split("/");
  switch (a) {
    case "feed": return { name: "feed" };
    case "test": return { name: "test" };
    case "incident": return { name: "incident", id: b || null };
    case "alternatives": return { name: "alternatives", incidentId: b || null, edgeId: c || null };
    default: return { name: "suppliers" };
  }
}

function useRoute() {
  const [r, setR] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const on = () => { setR(parse(location.hash)); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}

function useTheme() {
  const [t, setT] = useState<"auto" | "light" | "dark">(() => { try { const s = localStorage.getItem("ss.theme"); return s === "light" || s === "dark" ? s : "auto"; } catch { return "auto"; } });
  useEffect(() => {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("ss.theme", t); } catch { /* ignore */ }
  }, [t]);
  return [t, setT] as const;
}

const TABS: Array<[Route["name"], string, string]> = [
  ["suppliers", "Suppliers", "#/suppliers"], ["feed", "Live feed", "#/feed"], ["incident", "Incident", "#/incident"],
  ["alternatives", "Alternatives", "#/alternatives"], ["test", "TEST page", "#/test"],
];

function Shell() {
  const route = useRoute();
  const { health, mode, setMode, mockRoutes, error, alerts, sse } = useStore();
  const [theme, setTheme] = useTheme();

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <div className="top-in">
          <h1 className="brand">SecondSource<small>live supply-chain monitor</small></h1>
          <nav className="tabs" aria-label="Sections">
            {TABS.map(([n, label, href]) => (
              <a key={n} href={href} aria-current={route.name === n ? "page" : undefined}>
                {label}{n === "feed" && alerts.length > 0 && <span className="sr"> ({alerts.length} alerts)</span>}
              </a>
            ))}
          </nav>
          <div className="top-right">
            {health && (
              <span className="row" style={{ gap: 6 }} aria-label="Provider modes right now">
                {(Object.entries(health.providers) as Array<[string, { hasKey: boolean; mode: "LIVE" | "REC" | "SEED" | "LOCAL" }]>).map(([k, v]) => (
                  <span key={k} className="small" title={`${k}: ${v.hasKey ? "key present" : "no key"}, ${v.mode}`}>{k} <ModeBadge mode={v.mode} /></span>
                ))}
              </span>
            )}
            <label className="sr" htmlFor="apimode">Data source</label>
            <select id="apimode" value={mode} onChange={(e) => setMode(e.target.value as ApiMode)} style={{ width: "auto", padding: "4px 8px", fontSize: ".85rem" }} title="auto: real backend, mock only where a route is missing">
              <option value="auto">API: auto</option><option value="real">API: real only</option><option value="mock">API: mock only</option>
            </select>
            <label className="sr" htmlFor="theme">Theme</label>
            <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as "auto" | "light" | "dark")} style={{ width: "auto", padding: "4px 8px", fontSize: ".85rem" }}>
              <option value="auto">Theme: auto</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </header>

      {mockRoutes.length > 0 && (
        <div className="banner" role="status">
          <div>
            <MockBadge /> <b>Some data on screen comes from the UI's mock layer, not the backend.</b>{" "}
            {mode === "mock" ? "Mock-only mode is on." : "These routes were unreachable or not built yet, so they fell back to mock data:"}{" "}
            <span className="mono small">{mockRoutes.join(" · ")}</span>. Mock facts are labelled SEED or LOCAL and are fictional; none of it is live. Switch the data source to “real only” to turn the mock off.
          </div>
        </div>
      )}
      {error && mode === "real" && (
        <div className="banner err" role="alert"><div><b>Backend problem:</b> {error}</div></div>
      )}
      {sse === "closed" && mode !== "mock" && (
        <div className="banner err" role="alert"><div>The live stream is closed. Updates are refreshed by polling where possible; reload the page to reconnect.</div></div>
      )}

      <main id="main" tabIndex={-1}>
        {route.name === "suppliers" && <SuppliersView />}
        {route.name === "feed" && <FeedView />}
        {route.name === "incident" && <IncidentView incidentId={route.id} />}
        {route.name === "alternatives" && <AlternativesView incidentId={route.incidentId} edgeId={route.edgeId} />}
        {route.name === "test" && <TestPageView />}
      </main>
    </>
  );
}

export function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
