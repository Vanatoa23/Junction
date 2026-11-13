import type {
  Alert, AlternativesResponse, ApproveCandidateRequest, ApproveCandidateResponse, ChooseSupplierRequest, Event, HealthResponse,
  IncidentDetailResponse, ResolveSuppliersRequest, SupplierRow, TestNoticeState,
} from "@secondsource/shared";
import { isMockId, mockApi } from "./mock";

/**
 * API facade. Real backend first; the typed mock layer (lib/mock.ts) only where allowed.
 *   mode "real": never mock.   mode "mock": always mock.   mode "auto" (default): try real, fall back to mock
 *   for a route that is unreachable or still a 501/5xx stub. Every route that was served by the mock is
 *   recorded in `mockRoutes` and shown in the UI banner, so mock data can never pass as backend data.
 */
export type ApiMode = "auto" | "mock" | "real";

export class HttpError extends Error {
  constructor(public status: number | undefined, message: string) { super(message); }
}

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

export function readMode(): ApiMode {
  const q = new URLSearchParams(location.search).get("mock");
  if (q === "1") return "mock";
  if (q === "0") return "real";
  const s = store.get("ss.apiMode");
  return s === "mock" || s === "real" ? s : "auto";
}
let mode: ApiMode = readMode();
export const getMode = () => mode;
export function setMode(m: ApiMode) { mode = m; store.set("ss.apiMode", m); mockRoutes.clear(); notify(); }

const mockRoutes = new Set<string>();
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());
export const mockRouteStore = {
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  snapshot: () => [...mockRoutes].sort().join(","),
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(8000) });
  } catch (e) {
    throw new HttpError(undefined, `backend unreachable (${(e as Error).message})`);
  }
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* not JSON (e.g. proxy error page) */ }
  if (!res.ok || body === null) {
    const msg = (body as { error?: string } | null)?.error ?? `${res.status} ${res.statusText || "bad response"}`;
    throw new HttpError(res.status, msg);
  }
  return body as T;
}

/** Network errors, missing routes, 501 stubs and 5xx fall back to the mock in auto mode. */
const fallbackable = (e: unknown) => e instanceof HttpError && (e.status === undefined || e.status === 404 || e.status >= 500);

async function call<T>(route: string, real: () => Promise<T>, mock: () => Promise<T>, forceMock = false): Promise<T> {
  const useMock = () => { mockRoutes.add(route); notify(); return mock(); };
  if (mode === "mock" || (forceMock && mode !== "real")) return useMock();
  try {
    return await real();
  } catch (e) {
    if (mode === "auto" && fallbackable(e)) return useMock();
    throw e;
  }
}

const q = (o: Record<string, string>) => "?" + new URLSearchParams(o).toString();

export const api = {
  health: () => call<HealthResponse>("GET /health", () => http("/health"), mockApi.health),
  listSuppliers: async () => (await call<{ suppliers: SupplierRow[] }>("GET /suppliers", () => http("/suppliers"), async () => ({ suppliers: await mockApi.listSuppliers() }))).suppliers,
  resolve: async (req: ResolveSuppliersRequest) =>
    (await call<{ suppliers: SupplierRow[] }>("POST /suppliers/resolve", () => http("/suppliers/resolve", { method: "POST", body: JSON.stringify(req) }), async () => ({ suppliers: await mockApi.resolve(req) }))).suppliers,
  choose: async (edgeId: string, body: ChooseSupplierRequest) =>
    (await call<{ supplier: SupplierRow }>("POST /suppliers/:edgeId/choose", () => http(`/suppliers/${edgeId}/choose`, { method: "POST", body: JSON.stringify(body) }), async () => ({ supplier: await mockApi.choose(edgeId, body) }), isMockId(edgeId))).supplier,
  listEvents: async () => (await call<{ events: Event[] }>("GET /events", () => http("/events?limit=50"), async () => ({ events: await mockApi.listEvents() }))).events,
  listAlerts: async () => (await call<{ alerts: Alert[] }>("GET /alerts", () => http("/alerts?limit=50"), async () => ({ alerts: await mockApi.listAlerts() }))).alerts,
  incident: (id: string) => call<IncidentDetailResponse>("GET /incidents/:id", () => http(`/incidents/${id}`), () => mockApi.incident(id), isMockId(id)),
  alternatives: (incidentId: string, edgeId: string) =>
    call<AlternativesResponse>("GET /incidents/:id/alternatives", () => http(`/incidents/${incidentId}/alternatives${q({ edgeId })}`), () => mockApi.alternatives(incidentId, edgeId), isMockId(incidentId)),
  approve: (id: string, body: ApproveCandidateRequest) =>
    call<ApproveCandidateResponse>("POST /candidates/:id/approve", () => http(`/candidates/${id}/approve`, { method: "POST", body: JSON.stringify(body) }), () => mockApi.approve(id, body), isMockId(id)),
  noticeState: () => call<TestNoticeState>("GET /test-notice/state", () => http("/test-notice/state"), mockApi.noticeState),
  publishNotice: (text: string) => call<TestNoticeState>("PUT /test-notice", () => http("/test-notice", { method: "PUT", body: JSON.stringify({ text }) }), () => mockApi.publishNotice(text)),
};
