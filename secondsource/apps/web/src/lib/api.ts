import type {
  KnownCompaniesResponse, SnapSupplierRequest,
  AlternativesResponse, ApproveCandidateResponse, MapResponse, ListSuppliersResponse, ResolveSuppliersResponse, SaveDependencyRequest, SupplierDependency, SupplierInput, SupplierRow, TestNoticeState,
} from "@secondsource/shared";

/** Thin typed client for the API (proxied at /api). Errors become readable Error messages. */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { ...init, headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers } });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) throw new Error(body?.detail ? `${body.error}: ${typeof body.detail === "string" ? body.detail : "see details"}` : body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  map: () => call<MapResponse>("/map"),
  suppliers: () => call<ListSuppliersResponse>("/suppliers"),
  addSuppliers: (suppliers: Array<Partial<SupplierInput> & { name: string }>) =>
    call<ResolveSuppliersResponse>("/suppliers/resolve", { method: "POST", body: JSON.stringify({ suppliers }) }),
  choose: (edgeId: string, body: { companyId?: string; domain?: string }) =>
    call<{ supplier: SupplierRow }>(`/suppliers/${edgeId}/choose`, { method: "POST", body: JSON.stringify(body) }),
  dependencies: (edgeId: string) => call<{ dependencies: SupplierDependency[] }>(`/suppliers/${edgeId}/dependencies`),
  saveDependency: (edgeId: string, body: SaveDependencyRequest) =>
    call<{ dependencies: SupplierDependency[] }>(`/suppliers/${edgeId}/dependencies`, { method: "PUT", body: JSON.stringify(body) }),
  removeDependency: (edgeId: string, id: string) =>
    call<void>(`/suppliers/${edgeId}/dependencies/${id}`, { method: "DELETE" }),
  alternatives: (incidentId: string, edgeId: string) => call<AlternativesResponse>(`/incidents/${incidentId}/alternatives?edgeId=${edgeId}`),
  approve: (candidateId: string) => call<ApproveCandidateResponse>(`/candidates/${candidateId}/approve`, { method: "POST", body: JSON.stringify({ actor: "You" }) }),
  publishNotice: (text: string) => call<TestNoticeState>("/test-notice", { method: "PUT", body: JSON.stringify({ text }) }),
  notice: () => call<TestNoticeState>("/test-notice/state"),
  updateDetails: (edgeId: string, body: Record<string, unknown>) => call<MapResponse>(`/suppliers/${edgeId}/details`, { method: "PUT", body: JSON.stringify(body) }),
  known: (q: { q?: string; country?: string; city?: string }) =>
    call<KnownCompaniesResponse>(`/known?${new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][])}`),
  snap: (body: SnapSupplierRequest) => call<{ edgeId: string; map: MapResponse }>("/suppliers/snap", { method: "POST", body: JSON.stringify(body) }),
  updateProfile: (body: { name?: string; city?: string | null; country?: string | null }) => call<MapResponse>("/profile", { method: "PUT", body: JSON.stringify(body) }),
};
