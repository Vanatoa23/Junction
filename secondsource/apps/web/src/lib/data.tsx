import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SSE_EVENT_TYPES, type MapResponse, type SupplierRow } from "@secondsource/shared";
import { api } from "./api";

/**
 * One place that holds what the screens show: the map (hub, direct suppliers with risk, open incidents) and the
 * full supplier rows (needed for choices and "what we found"). A live stream tells us when to refresh.
 */
interface Data {
  map: MapResponse | null;
  rows: SupplierRow[];
  merged: Record<string, string>;
  error: string | null;
  /** Bumps whenever the server told us something changed (used to refresh open panels). */
  version: number;
  reload: () => Promise<void>;
  live: boolean;
}

const Ctx = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<MapResponse | null>(null);
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [merged, setMerged] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const reload = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([api.map(), api.suppliers()]);
      setMap(m);
      setRows(r.suppliers);
      setMerged(r.merged ?? {});
      setError(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
    const es = new EventSource("/api/stream");
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    const soon = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void reload(), 250);
    };
    for (const t of SSE_EVENT_TYPES) es.addEventListener(t, soon);
    return () => {
      es.close();
      window.clearTimeout(timer.current);
    };
  }, [reload]);

  const value = useMemo(() => ({ map, rows, merged, error, version, reload, live }), [map, rows, merged, error, version, reload, live]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): Data {
  const v = useContext(Ctx);
  if (!v) throw new Error("DataProvider missing");
  return v;
}
