import { z } from "zod";
import { FootprintType, Incident } from "@secondsource/shared";

/**
 * Engine-only API additions (NOT in packages/shared yet; UI may import from here via the API docs, or the
 * integrator can promote them into shared):
 *   GET  /incidents?limit=            -> ListIncidentsResponse   (includes unmappedNames: "needs human mapping")
 *   POST /incidents/:id/mapping       -> body MapIncidentRequest; a person supplies footprint keys for names the
 *                                        system could not resolve. Keys are stored SEEDED (user-typed), unmapped
 *                                        names are cleared, match_incident re-runs.
 */
export const ListIncidentsResponse = z.object({ incidents: z.array(Incident) });
export type ListIncidentsResponse = z.infer<typeof ListIncidentsResponse>;

export const MapIncidentRequest = z.object({
  keys: z.array(z.object({ type: FootprintType, value: z.string().min(1) })).min(1),
});
export type MapIncidentRequest = z.infer<typeof MapIncidentRequest>;
