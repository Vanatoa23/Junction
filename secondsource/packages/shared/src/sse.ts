import { z } from "zod";
import { Alert, Event, SourceMode, SupplierStatus } from "./domain";

/**
 * CONTRACT: Server-Sent Events on GET /stream.
 *
 * Every message is `event: <type>` + `data: <JSON SseEnvelope>` + `id: <seq>`.
 * Producers (API or worker) call publish() in apps/api/src/bus.ts; delivery
 * is cross-process via Postgres LISTEN/NOTIFY. Small payloads only: clients
 * can refetch the REST resource if they need more.
 */
const base = { id: z.string(), at: z.string().datetime({ offset: true }) };

export const SupplierStatusEvent = z.object({
  ...base,
  type: z.literal("supplier.status"),
  data: z.object({ edgeId: z.string().uuid(), status: SupplierStatus, mode: SourceMode.nullable(), note: z.string().nullable() }),
});
export const EventReceivedEvent = z.object({
  ...base,
  type: z.literal("event.received"),
  data: z.object({ event: Event }),
});
export const AlertCreatedEvent = z.object({
  ...base,
  type: z.literal("alert.created"),
  data: z.object({ alert: Alert }),
});
export const AlternativesReadyEvent = z.object({
  ...base,
  type: z.literal("alternatives.ready"),
  data: z.object({ incidentId: z.string().uuid(), edgeId: z.string().uuid(), candidateIds: z.array(z.string().uuid()) }),
});

export const SseEnvelope = z.discriminatedUnion("type", [
  SupplierStatusEvent, EventReceivedEvent, AlertCreatedEvent, AlternativesReadyEvent,
]);
export type SseEnvelope = z.infer<typeof SseEnvelope>;
export type SseEventType = SseEnvelope["type"];
export const SSE_EVENT_TYPES = ["supplier.status", "event.received", "alert.created", "alternatives.ready"] as const;

/** Payload for publish(): everything except id/at, which the bus fills in. */
export type SsePayload = SseEnvelope extends infer E ? (E extends SseEnvelope ? Pick<E, "type" | "data"> : never) : never;
