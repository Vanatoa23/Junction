import { z } from "zod";
import {
  Criticality, Alert, ApprovalAudit, Candidate, Event, Incident, ProviderName, SourceMode, SupplierInput, SupplierRow,
} from "./domain";

/**
 * CONTRACT: HTTP API. Paths are served by apps/api at the root (the web dev
 * server proxies /api/* -> API, stripping /api). No auth in the MVP: every
 * request acts as DEMO_CLIENT_ID.
 *
 * Errors: non-2xx always returns ApiError.
 */
export const ApiError = z.object({ error: z.string(), detail: z.unknown().optional() });
export type ApiError = z.infer<typeof ApiError>;

/** GET /health */
export const HealthResponse = z.object({
  ok: z.boolean(),
  db: z.boolean(),
  /** Which mode each provider will use RIGHT NOW given keys + SOURCE_MODE. */
  providers: z.record(ProviderName, z.object({ hasKey: z.boolean(), mode: SourceMode })),
  publicBaseUrl: z.string(),
  testNoticeUrl: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

/** POST /suppliers/resolve  (owner: Onboarding). 202; rows come back PENDING, progress arrives via SSE supplier.status. */
export const ResolveSuppliersRequest = z.object({ suppliers: z.array(SupplierInput).min(1).max(25) });
export type ResolveSuppliersRequest = z.infer<typeof ResolveSuppliersRequest>;
export const ResolveSuppliersResponse = z.object({ suppliers: z.array(SupplierRow), duplicates: z.number().int().nonnegative() });
export type ResolveSuppliersResponse = z.infer<typeof ResolveSuppliersResponse>;

/** GET /suppliers */
export const ListSuppliersResponse = z.object({ suppliers: z.array(SupplierRow), merged: z.record(z.string().uuid()).default({}) });
export type ListSuppliersResponse = z.infer<typeof ListSuppliersResponse>;

/** POST /suppliers/:edgeId/choose  (owner: Onboarding). Chooser for AMBIGUOUS/UNRESOLVED rows. */
export const ChooseSupplierRequest = z.object({
  companyId: z.string().uuid().optional(),
  domain: z.string().optional(),
});
export type ChooseSupplierRequest = z.infer<typeof ChooseSupplierRequest>;
export const ChooseSupplierResponse = z.object({ supplier: SupplierRow });
export type ChooseSupplierResponse = z.infer<typeof ChooseSupplierResponse>;

/** GET /suppliers/:edgeId */
export const SupplierDetailResponse = z.object({ supplier: SupplierRow });
export type SupplierDetailResponse = z.infer<typeof SupplierDetailResponse>;

/** POST /webhooks/contextdev  (owner: Ingest). Always 202 fast; real work happens in the worker. Payload shape is in docs/api-findings.md. */
export const WebhookAck = z.object({ received: z.literal(true), eventId: z.string().uuid().nullable() });
export type WebhookAck = z.infer<typeof WebhookAck>;

/** GET /events?limit=  (owner: Ingest). Backfill for the live feed. */
export const ListEventsResponse = z.object({ events: z.array(Event) });
export type ListEventsResponse = z.infer<typeof ListEventsResponse>;

/** GET /alerts?limit=  (owner: Engine). Backfill for the live feed. */
export const ListAlertsResponse = z.object({ alerts: z.array(Alert) });
export type ListAlertsResponse = z.infer<typeof ListAlertsResponse>;

/** GET /incidents/:id  (owner: Engine) */
export const IncidentDetailResponse = z.object({
  incident: Incident,
  event: Event,
  alerts: z.array(Alert),
});
export type IncidentDetailResponse = z.infer<typeof IncidentDetailResponse>;

/** GET /incidents/:id/alternatives?edgeId=  (owner: Engine). Ranked: VERIFIED first, then UNVERIFIED, then FAILED. */
export const AlternativesResponse = z.object({
  /** false while the worker is still computing; wait for SSE alternatives.ready. */
  ready: z.boolean(),
  candidates: z.array(Candidate),
});
export type AlternativesResponse = z.infer<typeof AlternativesResponse>;

/** POST /candidates/:id/approve  (owner: Engine). 409 unless verdict=VERIFIED. Writes an approval_audit row. */
export const ApproveCandidateRequest = z.object({
  actor: z.string().default("demo-user"),
  note: z.string().nullable().default(null),
});
export type ApproveCandidateRequest = z.infer<typeof ApproveCandidateRequest>;
export const ApproveCandidateResponse = z.object({ candidate: Candidate, audit: ApprovalAudit });
export type ApproveCandidateResponse = z.infer<typeof ApproveCandidateResponse>;

/** GET /test-notice (HTML, labelled TEST, watched by the monitor), GET /test-notice/state, PUT /test-notice  (owner: Ingest; scaffold by Foundation). */
export const TestNoticeState = z.object({ text: z.string(), updatedAt: z.string(), url: z.string() });
export type TestNoticeState = z.infer<typeof TestNoticeState>;
export const UpdateTestNoticeRequest = z.object({ text: z.string().max(5000) });
export type UpdateTestNoticeRequest = z.infer<typeof UpdateTestNoticeRequest>;


export const DependencyKind = z.enum(["PORT", "PLANT", "SUPPLIER"]);
export const DependencyConfidence = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const SaveDependencyRequest = z.object({
  parentId: z.string().uuid().nullable(),
  kind: DependencyKind,
  name: z.string().trim().min(1).max(140),
  matchKey: z.string().trim().max(140).default(""),
  source: z.string().trim().min(1).max(300),
  sourceUrl: z.string().trim().url().refine((value) => /^https?:\/\//i.test(value)).nullable(),
  confidence: DependencyConfidence,
  verifiedOn: z.string().date(),
}).superRefine((link, ctx) => {
  if (link.kind === "PORT" && !/^[A-Z]{2}[A-Z0-9]{3}$/i.test(link.matchKey)) {
    ctx.addIssue({ code: "custom", path: ["matchKey"], message: "Enter a five-character port code, such as NLRTM." });
  }
  if (link.kind === "PLANT" && !/^[a-z0-9][a-z0-9._-]*$/i.test(link.matchKey)) {
    ctx.addIssue({ code: "custom", path: ["matchKey"], message: "Enter a stable plant identifier." });
  }
});
export type SaveDependencyRequest = z.infer<typeof SaveDependencyRequest>;

export const SupplierDependency = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  kind: DependencyKind,
  name: z.string(),
  matchKey: z.string(),
  source: z.string(),
  sourceUrl: z.string().url().nullable(),
  confidence: DependencyConfidence,
  verifiedOn: z.string().date(),
});
export type SupplierDependency = z.infer<typeof SupplierDependency>;

export const SupplierExposure = z.object({
  incidentId: z.string().uuid(),
  headline: z.string(),
  path: z.array(SupplierDependency).min(1),
});
export type SupplierExposure = z.infer<typeof SupplierExposure>;

// ---------------------------------------------------------------- map (served by apps/api/src/map)
export const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

/**
 * Per direct supplier. Computed from the supplier's own footprint AND its deeper tiers (their suppliers, ports,
 * plants), which are researched in the background and NEVER returned or drawn. `reasons` are plain sentences.
 */
export const SupplierRisk = z.object({
  score: z.number().int().min(0).max(100),
  level: RiskLevel,
  reasons: z.array(z.string()),
  /** How many deeper-tier companies were looked at. 0 => coverage is limited and the score may be too low. */
  deeperChecked: z.number().int().min(0),
  coverage: z.enum(["GOOD", "LIMITED"]),
});
export type SupplierRisk = z.infer<typeof SupplierRisk>;

export const MapSupplier = z.object({
  edgeId: z.string().uuid(),
  name: z.string(),
  status: z.enum(["PENDING", "RESOLVED", "AMBIGUOUS", "UNRESOLVED", "MONITORED"]),
  country: z.string().nullable(),
  city: z.string().nullable(),
  /** null when we cannot place it yet (no country or city given). */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** CITY = found by city; COUNTRY = country centre only ("approximate location"). */
  precision: z.enum(["CITY", "COUNTRY"]).nullable(),
  category: z.string().nullable(),
  /** What the user told us about it (all optional). */
  supplies: z.string().nullable(),
  criticality: Criticality.nullable(),
  annualSpendEur: z.number().nullable(),
  leadTimeDays: z.number().nullable(),
  risk: SupplierRisk,
  exposures: z.array(SupplierExposure).default([]),
  /** Known facilities of this supplier from the data pack (positions are country centres when only the country is known). */
  sites: z.array(z.object({ country: z.string(), count: z.number().int(), lat: z.number().nullable(), lng: z.number().nullable() })),
  /** True when the name is an alias because the public dataset anonymises it. */
  anonymised: z.boolean(),
  /** Latest open alert for this supplier, in plain words. */
  alert: z.object({ alertId: z.string().uuid(), incidentId: z.string().uuid(), headline: z.string(), severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]) }).nullable(),
});
export type MapSupplier = z.infer<typeof MapSupplier>;

export const MapIncident = z.object({
  id: z.string().uuid(),
  headline: z.string(),
  type: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  createdAt: z.string(),
  affected: z.array(z.string()),
  exposureCount: z.number().int().nonnegative().default(0),
  /** Where to pulse it on the map (port position), if known. */
  point: z.object({ lat: z.number(), lng: z.number(), label: z.string() }).nullable(),
  /** The page text the notice came from (a demo TEST notice is labelled as such). */
  isTest: z.boolean(),
  sourceUrl: z.string(),
  quote: z.string(),
  /** Seconds from the source change to the alert, if both stamps are known. */
  noticedInSeconds: z.number().nullable(),
});
export type MapIncident = z.infer<typeof MapIncident>;

/** GET /map */
export const MapResponse = z.object({
  hub: z.object({ name: z.string(), city: z.string().nullable(), country: z.string().nullable(), lat: z.number().nullable(), lng: z.number().nullable() }),
  suppliers: z.array(MapSupplier),
  incidents: z.array(MapIncident),
  /** Ports that matter right now (used by a direct supplier or named by an open incident). Anchors on the map, not suppliers. */
  ports: z.array(z.object({ id: z.string(), label: z.string(), lat: z.number(), lng: z.number() })),
  /** What the "Test a disruption" control publishes for this client's data. */
  demo: z.object({ noticeText: z.string(), noticeLabel: z.string() }),
  /** "fictional" (built-in seed) or "cala" (real public data pack). */
  scenario: z.string(),
});
export type MapResponse = z.infer<typeof MapResponse>;

/** PUT /profile: tell us who you are (your company name and where it is). */
export const UpdateProfileRequest = z.object({ name: z.string().min(1).optional(), city: z.string().nullable().optional(), country: z.string().length(2).nullable().optional() });
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

/** GET /known?q=&country=&city=  Known companies from the data pack the user can snap a new supplier to. */
export const KnownCompany = z.object({
  companyId: z.string().uuid(),
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  category: z.string().nullable(),
  sites: z.number().int(),
  anonymised: z.boolean(),
});
export type KnownCompany = z.infer<typeof KnownCompany>;
export const KnownCompaniesResponse = z.object({ companies: z.array(KnownCompany) });
export type KnownCompaniesResponse = z.infer<typeof KnownCompaniesResponse>;

/** POST /suppliers/snap  Add a supplier that is a known company from the data pack (no lookup needed). */
export const SnapSupplierRequest = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).optional(),
  supplies: z.string().nullable().optional(),
  criticality: Criticality.nullable().optional(),
  annualSpendEur: z.number().nonnegative().nullable().optional(),
  leadTimeDays: z.number().int().nonnegative().nullable().optional(),
  contact: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type SnapSupplierRequest = z.infer<typeof SnapSupplierRequest>;
