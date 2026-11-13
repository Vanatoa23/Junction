import { z } from "zod";
import {
  Alert, ApprovalAudit, Candidate, Event, Incident, ProviderName, SourceMode, SupplierInput, SupplierRow,
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
export const ResolveSuppliersResponse = z.object({ suppliers: z.array(SupplierRow) });
export type ResolveSuppliersResponse = z.infer<typeof ResolveSuppliersResponse>;

/** GET /suppliers */
export const ListSuppliersResponse = z.object({ suppliers: z.array(SupplierRow) });
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
