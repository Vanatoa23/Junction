import { z } from "zod";

/**
 * CONTRACT: job queue kinds + payloads. A new kind needs an entry here
 * (integrator approves) so the worker's registry stays typed.
 *
 *  resolve_supplier    Onboarding  resolve one supplier_edge
 *  extract_footprint   Onboarding  build footprint for a company
 *  arm_monitors        Ingest      create monitor / start poll for a company or footprint key
 *  poll_page           Ingest      scrape a watched URL, diff, emit event
 *  classify_event      Engine      Gemini classify + quote check + create incident
 *  match_incident      Engine      match incident footprint to client suppliers, create alerts
 *  find_alternatives   Engine      candidates + C1..C5 (+ live news) for an alert
 */
export const JobPayloads = {
  resolve_supplier: z.object({ edgeId: z.string().uuid() }),
  extract_footprint: z.object({ companyId: z.string().uuid(), edgeId: z.string().uuid().nullable() }),
  arm_monitors: z.object({ edgeId: z.string().uuid() }),
  poll_page: z.object({ url: z.string().url(), label: z.string().nullable().default(null) }),
  classify_event: z.object({ eventId: z.string().uuid() }),
  match_incident: z.object({ incidentId: z.string().uuid() }),
  find_alternatives: z.object({ incidentId: z.string().uuid(), edgeId: z.string().uuid() }),
} as const;

export type JobKind = keyof typeof JobPayloads;
export const JOB_KINDS = Object.keys(JobPayloads) as JobKind[];
export type JobPayload<K extends JobKind> = z.infer<(typeof JobPayloads)[K]>;
