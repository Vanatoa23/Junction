import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  SSE_EVENT_TYPES, type Alert, type ApprovalAudit, type Event, type HealthResponse, type SseEnvelope, type SupplierInput, type SupplierRow,
  type ChooseSupplierRequest,
} from "@secondsource/shared";
import { api, getMode, mockRouteStore, setMode as setApiMode, type ApiMode } from "./api";
import { mockBus } from "./mock";

export type SseState = "connecting" | "open" | "closed" | "off";

interface Store {
  mode: ApiMode;
  setMode: (m: ApiMode) => void;
  mockRoutes: string[];
  health: HealthResponse | null;
  suppliers: SupplierRow[] | null;
  events: Event[];
  alerts: Alert[];
  sse: SseState;
  error: string | null;
  fresh: ReadonlySet<string>;
  altVersion: number;
  audits: Record<string, ApprovalAudit>;
  resolve: (inputs: SupplierInput[]) => Promise<void>;
  choose: (edgeId: string, body: ChooseSupplierRequest) => Promise<void>;
  approve: (candidateId: string, note: string | null) => Promise<ApprovalAudit>;
  publishNotice: (text: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider missing"); return s; };

const upsertBy = <T,>(list: T[], item: T, id: (t: T) => string, max = 200) => {
  const i = list.findIndex((x) => id(x) === id(item));
  if (i >= 0) { const c = list.slice(); c[i] = item; return c; }
  return [item, ...list].slice(0, max);
};
const newest = <T extends { createdAt: string }>(l: T[]) => l.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ApiMode>(getMode());
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRow[] | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sse, setSse] = useState<SseState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [altVersion, setAltVersion] = useState(0);
  const [audits, setAudits] = useState<Record<string, ApprovalAudit>>({});
  const mockRoutesStr = useSyncExternalStore(mockRouteStore.subscribe, mockRouteStore.snapshot);
  const mockRoutes = useMemo(() => (mockRoutesStr ? mockRoutesStr.split(",") : []), [mockRoutesStr]);

  const guard = useCallback(async <T,>(p: Promise<T>): Promise<T | undefined> => {
    try { const r = await p; setError(null); return r; } catch (e) { setError((e as Error).message); return undefined; }
  }, []);

  const loadSuppliers = useCallback(async () => { const r = await guard(api.listSuppliers()); if (r) setSuppliers(r); }, [guard]);
  const loadFeed = useCallback(async () => {
    const [e, a] = await Promise.all([guard(api.listEvents()), guard(api.listAlerts())]);
    if (e) setEvents(e);
    if (a) setAlerts(a);
  }, [guard]);
  const refresh = useCallback(async () => {
    const h = await guard(api.health());
    if (h) setHealth(h);
    await Promise.all([loadSuppliers(), loadFeed()]);
  }, [guard, loadSuppliers, loadFeed]);

  // initial load + reload when the API mode is switched
  useEffect(() => { setSuppliers(null); setEvents([]); setAlerts([]); void refresh(); }, [mode, refresh]);

  // SSE: real stream (unless mock-only) + in-process mock bus (unless real-only)
  const debounce = useRef<number | undefined>(undefined);
  useEffect(() => {
    const markFresh = (id: string) => {
      setFresh((f) => new Set(f).add(id));
      window.setTimeout(() => setFresh((f) => { const n = new Set(f); n.delete(id); return n; }), 1500);
    };
    const handle = (env: SseEnvelope) => {
      switch (env.type) {
        case "supplier.status":
          setSuppliers((rows) => rows?.map((r) => (r.edgeId === env.data.edgeId ? { ...r, status: env.data.status } : r)) ?? rows);
          window.clearTimeout(debounce.current);
          debounce.current = window.setTimeout(() => void loadSuppliers(), 150);
          break;
        case "event.received":
          setEvents((l) => upsertBy(l, env.data.event, (x) => x.id));
          markFresh(env.data.event.id);
          break;
        case "alert.created":
          setAlerts((l) => upsertBy(l, env.data.alert, (x) => x.id));
          markFresh(env.data.alert.id);
          break;
        case "alternatives.ready":
          setAltVersion((v) => v + 1);
          break;
      }
    };
    const offs: Array<() => void> = [];
    if (mode !== "real") offs.push(mockBus.subscribe(handle));
    let es: EventSource | null = null;
    if (mode !== "mock") {
      es = new EventSource("/api/stream");
      es.onopen = () => setSse("open");
      es.onerror = () => setSse(es?.readyState === EventSource.CLOSED ? "closed" : "connecting");
      for (const t of SSE_EVENT_TYPES) {
        es.addEventListener(t, (e) => {
          try { handle(JSON.parse((e as MessageEvent).data) as SseEnvelope); } catch { /* ignore malformed frame */ }
        });
      }
    } else setSse("off");
    return () => { offs.forEach((f) => f()); es?.close(); window.clearTimeout(debounce.current); };
  }, [mode, loadSuppliers]);

  // fallback if SSE is down: poll while anything is still in flight
  const pending = suppliers?.some((s) => s.status === "PENDING" || s.status === "RESOLVED") ?? false;
  useEffect(() => {
    if (!pending || sse === "open" || sse === "off") return;
    const t = window.setInterval(() => void loadSuppliers(), 3000);
    return () => window.clearInterval(t);
  }, [pending, sse, loadSuppliers]);

  const value: Store = {
    mode, mockRoutes, health, suppliers, events, alerts, sse, error, fresh, altVersion, audits, refresh,
    setMode: (m) => { setApiMode(m); setModeState(m); },
    resolve: async (inputs) => {
      const rows = await guard(api.resolve({ suppliers: inputs }));
      if (rows) setSuppliers((cur) => [...rows, ...(cur ?? []).filter((c) => !rows.some((r) => r.edgeId === c.edgeId))]);
      void loadSuppliers();
    },
    choose: async (edgeId, body) => { await guard(api.choose(edgeId, body)); await loadSuppliers(); },
    approve: async (id, note) => {
      const r = await api.approve(id, { actor: "demo-user", note });
      setAudits((a) => ({ ...a, [id]: r.audit }));
      setAltVersion((v) => v + 1);
      return r.audit;
    },
    publishNotice: async (text) => { await api.publishNotice(text); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const incidentsFromAlerts = (alerts: Alert[]) => {
  const m = new Map<string, Alert[]>();
  for (const a of newest(alerts)) m.set(a.incidentId, [...(m.get(a.incidentId) ?? []), a]);
  return [...m.entries()].map(([incidentId, list]) => ({ incidentId, alerts: list, latest: list[0]!.createdAt }));
};
