import { z } from "zod";
import { IncidentType, Severity } from "./domain";
import { FootprintType, KeyState } from "./footprint";

/**
 * CONTRACT: output of the incident classifier (gemini.classify op), identical for
 *   - the live Gemini call (UNVERIFIED, enabled by GEMINI_API_KEY), and
 *   - the deterministic rule-based classifier used in SEED mode (no key).
 * The caller (Engine) MUST run verifyQuote(fetchedText, quote) in code and drop the event if it fails.
 * `incident:false` means "this change is not an incident" (event is logged, not dropped as an error).
 */
export const ClassifiedKey = z.object({
  type: FootprintType,
  value: z.string().min(1),
  /** CONFIRMED = named in the quote; INFERRED = derived (e.g. region of a named port). */
  state: KeyState,
  /** Verbatim supporting text, if any. Verified in code like the main quote. */
  quote: z.string().nullable().default(null),
});
export type ClassifiedKey = z.infer<typeof ClassifiedKey>;

export const ClassifyOutput = z.discriminatedUnion("incident", [
  z.object({ incident: z.literal(false), classifier: z.string(), reason: z.string() }),
  z.object({
    incident: z.literal(true),
    /** e.g. "gemini:<model>" or "rule-based-v1". UI shows it next to the SEED/LIVE badge. */
    classifier: z.string(),
    type: IncidentType,
    severity: Severity,
    title: z.string(),
    /** Must be a verbatim (whitespace-normalised) substring of the fetched text. */
    quote: z.string().min(1),
    keys: z.array(ClassifiedKey),
    /** Places/companies named that could not be mapped to keys: non-empty blocks the automatic alert. */
    unmappedNames: z.array(z.string()),
  }),
]);
export type ClassifyOutput = z.infer<typeof ClassifyOutput>;
