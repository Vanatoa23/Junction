import { z } from "zod";
import { FootprintKey } from "./footprint";

/** CONTRACT: domain objects. All ids are UUID strings, all times ISO-8601 strings. */

const id = z.string().uuid();
const iso = z.string().datetime({ offset: true });

/**
 * How a piece of data was obtained. The UI shows this as a badge on every result.
 *   LIVE  real vendor call just now
 *   REC   recorded real vendor response
 *   SEED  hand-made / deterministic seed or rule-based stand-in (no external call)
 *   LOCAL produced by our own code against our own host (e.g. fetch + diff of the TEST page). Not vendor data.
 */
export const SourceMode = z.enum(["LIVE", "REC", "SEED", "LOCAL"]);
export type SourceMode = z.infer<typeof SourceMode>;

/** "local" = our own in-process providers (no vendor, no key). */
export const ProviderName = z.enum(["contextdev", "exa", "cala", "gemini", "local"]);
export type ProviderName = z.infer<typeof ProviderName>;

/** A web page or API response a fact came from. */
export const Evidence = z.object({
  url: z.string().url(),
  quote: z.string().nullable().default(null),
  mode: SourceMode,
  provider: ProviderName.nullable().default(null),
});
export type Evidence = z.infer<typeof Evidence>;

// ---------------------------------------------------------------- Company
/** Public fact table (shared across clients, no client_id). */
export const Company = z.object({
  id,
  name: z.string(),
  legalName: z.string().nullable(),
  domain: z.string().nullable(),
  country: z.string().length(2).nullable(),
  category: z.string().nullable(),
  calaId: z.string().nullable(),
  parentCompanyId: id.nullable(),
  /** In the seeded candidate pool for alternatives. */
  inCandidatePool: z.boolean(),
  seeded: z.boolean(),
  mode: SourceMode,
  sourceUrls: z.array(z.string().url()),
  /** Where the company is (approximate). Optional: not every company has been placed. */
  city: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});
export type Company = z.infer<typeof Company>;

// ---------------------------------------------------------------- Supplier (client-private edge)
/**
 * pending -> resolved -> monitored is the happy path.
 * AMBIGUOUS: resolver score 0.6-0.85, waiting for the user to pick (chooser).
 * UNRESOLVED: score < 0.6, user must supply a domain.
 */
export const SupplierStatus = z.enum(["PENDING", "RESOLVED", "AMBIGUOUS", "UNRESOLVED", "MONITORED"]);
export type SupplierStatus = z.infer<typeof SupplierStatus>;

export const ResolveOption = z.object({
  companyId: id.nullable(),
  name: z.string(),
  domain: z.string().nullable(),
  country: z.string().nullable(),
  score: z.number().min(0).max(1),
  sourceUrls: z.array(z.string().url()),
  mode: SourceMode,
});
export type ResolveOption = z.infer<typeof ResolveOption>;

/**
 * What a user can tell us about a supplier. Only `name` is required; everything else is optional and never forced.
 * (Wording in the UI is plain: "what they supply", "how important", "yearly spend", "usual lead time".)
 */
export const Criticality = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type Criticality = z.infer<typeof Criticality>;

export const SupplierInput = z.object({
  name: z.string().min(1),
  domain: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  supplies: z.string().nullable().default(null),
  criticality: Criticality.nullable().default(null),
  annualSpendEur: z.number().nonnegative().nullable().default(null),
  leadTimeDays: z.number().int().nonnegative().nullable().default(null),
  contact: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type SupplierInput = z.infer<typeof SupplierInput>;

/** One row in the client's supplier grid (supplier_edge joined with company + footprint). */
export const SupplierRow = z.object({
  edgeId: id,
  input: SupplierInput,
  status: SupplierStatus,
  company: Company.nullable(),
  resolveScore: z.number().min(0).max(1).nullable(),
  /** Present when status=AMBIGUOUS. */
  options: z.array(ResolveOption),
  footprint: z.array(FootprintKey),
  /** Page/news monitors armed for this supplier (filled by Ingest). */
  monitors: z.array(z.object({ url: z.string().url(), kind: z.enum(["WEBHOOK", "POLL"]) })),
  seeded: z.boolean(),
  mode: SourceMode,
  sourceUrls: z.array(z.string().url()),
  updatedAt: iso,
});
export type SupplierRow = z.infer<typeof SupplierRow>;

// ---------------------------------------------------------------- Event / Incident / Alert
/** Per-stage latency. Any stage may be null while the pipeline is still running. */
export const Latency = z.object({
  /** When the source says the change happened (null if the source gives no timestamp: be honest, don't invent). */
  tSource: iso.nullable(),
  /** When we received the webhook or finished the poll that saw the change. */
  tReceived: iso.nullable(),
  tClassified: iso.nullable(),
  tAlert: iso.nullable(),
});
export type Latency = z.infer<typeof Latency>;

export const EventStatus = z.enum(["RECEIVED", "CLASSIFIED", "DROPPED", "INCIDENT"]);
export type EventStatus = z.infer<typeof EventStatus>;

/** A raw observed change (page diff, webhook, news item). Public fact table. */
export const Event = z.object({
  id,
  /** WEBHOOK = Context.dev monitor webhook; POLL = our scrape poll (UI must say "poll"). */
  via: z.enum(["WEBHOOK", "POLL", "NEWS"]),
  sourceUrl: z.string().url(),
  mode: SourceMode,
  status: EventStatus,
  /** Why it was dropped (e.g. "quote not found in fetched text"). Dropped events are logged, never silently lost. */
  dropReason: z.string().nullable(),
  /** True when the watched page is our own TEST page. UI must label it TEST. */
  isTest: z.boolean(),
  latency: Latency,
  createdAt: iso,
});
export type Event = z.infer<typeof Event>;

export const IncidentType = z.enum([
  "STRIKE", "FIRE", "RECALL", "SANCTION", "INSOLVENCY", "PORT_CLOSURE", "WEATHER", "CYBER", "OTHER",
]);
export type IncidentType = z.infer<typeof IncidentType>;

export const Severity = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type Severity = z.infer<typeof Severity>;

/** Public fact table. Created only if the quote check passed. */
export const Incident = z.object({
  id,
  eventId: id,
  type: IncidentType,
  severity: Severity,
  title: z.string(),
  /** VERBATIM text from the fetched page. Code verifies it; never trust the LLM. */
  quote: z.string().min(1),
  sourceUrl: z.string().url(),
  /** Official/primary source or 2 independent domains in 48h. Only CONFIRMED incidents are pushed to clients. */
  confirmation: z.enum(["CONFIRMED", "UNCONFIRMED"]),
  /** Keys the incident touches (same shape as company footprints). */
  footprint: z.array(FootprintKey),
  /** Names Gemini mentioned that we could not map to keys. Non-empty => needs human mapping, no auto alert. */
  unmappedNames: z.array(z.string()),
  mode: SourceMode,
  isTest: z.boolean(),
  createdAt: iso,
});
export type Incident = z.infer<typeof Incident>;

/** Client-private. One alert per (incident, affected supplier). */
export const Alert = z.object({
  id,
  incidentId: id,
  edgeId: id,
  supplierName: z.string(),
  incidentType: IncidentType,
  severity: Severity,
  /** Which incident keys matched which supplier keys (after region nesting). */
  matchedKeys: z.array(z.object({ incident: FootprintKey, supplier: FootprintKey })),
  sourceUrl: z.string().url(),
  quote: z.string(),
  latency: Latency,
  via: z.enum(["WEBHOOK", "POLL", "NEWS"]),
  mode: SourceMode,
  isTest: z.boolean(),
  createdAt: iso,
});
export type Alert = z.infer<typeof Alert>;

// ---------------------------------------------------------------- Candidates & checks
export const CheckId = z.enum(["C1", "C2", "C3", "C4", "C5", "LIVE_NEWS"]);
export type CheckId = z.infer<typeof CheckId>;

/** UNKNOWN never counts as PASS. */
export const CheckStatus = z.enum(["PASS", "FAIL", "UNKNOWN"]);
export type CheckStatus = z.infer<typeof CheckStatus>;

export const CheckResult = z.object({
  check: CheckId,
  status: CheckStatus,
  /** One human sentence: why. Shown in the table. */
  reason: z.string(),
  evidence: z.array(Evidence),
});
export type CheckResult = z.infer<typeof CheckResult>;

/**
 * VERIFIED   = C1..C5 all PASS (LIVE_NEWS PASS or not yet run; see PLAN.md)
 * FAILED     = any FAIL (shown greyed out with failing row)
 * UNVERIFIED = no FAIL but at least one UNKNOWN (human only, never ranked above VERIFIED)
 */
export const Verdict = z.enum(["VERIFIED", "UNVERIFIED", "FAILED"]);
export type Verdict = z.infer<typeof Verdict>;

export const CandidateStatus = z.enum(["PROPOSED", "APPROVED", "REJECTED"]);
export type CandidateStatus = z.infer<typeof CandidateStatus>;

export const Candidate = z.object({
  id,
  incidentId: id,
  /** The affected supplier this candidate would replace. */
  forEdgeId: id,
  company: Company,
  footprint: z.array(FootprintKey),
  checks: z.array(CheckResult),
  verdict: Verdict,
  rank: z.number().int().nullable(),
  status: CandidateStatus,
  mode: SourceMode,
  seeded: z.boolean(),
});
export type Candidate = z.infer<typeof Candidate>;

export const ApprovalAudit = z.object({
  id,
  candidateId: id,
  actor: z.string(),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().nullable(),
  /** Snapshot of verdict + check results at the moment of the decision. */
  snapshot: z.object({ verdict: Verdict, checks: z.array(CheckResult) }),
  createdAt: iso,
});
export type ApprovalAudit = z.infer<typeof ApprovalAudit>;
