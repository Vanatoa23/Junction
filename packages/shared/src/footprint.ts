import { z } from "zod";

/**
 * CONTRACT: footprint keys. Changes only through the integrator (see PLAN.md).
 *
 * A footprint is a set of typed keys describing what an entity (company or
 * incident) depends on / touches. Every key carries a state and, unless it is
 * explicitly SEEDED, a source URL.
 *
 * Value formats:
 *   REGION    ISO 3166-2 style, nested by "-":  FI, FI-UUS   (FI covers FI-UUS)
 *   PORT      UN/LOCODE:                         NLRTM, FIHEL
 *   PLANT     stable plant id (free string):     acme-oulu-1
 *   SANCTION  programme id:                      EU-RU-2024
 *   PARENT    Cala company id (or seeded id):    cala:1234
 *
 * UNKNOWN placeholder: when we have NO data for a type, store ONE key with
 * state=UNKNOWN and value="?" (UNKNOWN_VALUE). Checks must treat it as UNKNOWN,
 * never as PASS. A real value with state=UNKNOWN is not allowed.
 */
export const UNKNOWN_VALUE = "?";

export const FootprintType = z.enum(["REGION", "PORT", "PLANT", "SANCTION", "PARENT"]);
export type FootprintType = z.infer<typeof FootprintType>;

export const KeyState = z.enum(["CONFIRMED", "INFERRED", "UNKNOWN"]);
export type KeyState = z.infer<typeof KeyState>;

export const FootprintKey = z
  .object({
    type: FootprintType,
    value: z.string().min(1),
    state: KeyState,
    /** Where the fact came from. Required for CONFIRMED/INFERRED unless seeded. */
    sourceUrl: z.string().url().nullable(),
    /** Optional verbatim supporting text from the source. */
    sourceQuote: z.string().nullable().default(null),
    /** True when typed in by a user or loaded from seed data. UI must label it SEEDED. */
    seeded: z.boolean(),
  })
  .superRefine((k, ctx) => {
    if (k.state !== "UNKNOWN" && !k.seeded && !k.sourceUrl) {
      ctx.addIssue({ code: "custom", message: "CONFIRMED/INFERRED keys need a sourceUrl unless seeded", path: ["sourceUrl"] });
    }
    if (k.state === "UNKNOWN" && k.value !== UNKNOWN_VALUE) {
      ctx.addIssue({ code: "custom", message: `UNKNOWN keys must use value "${UNKNOWN_VALUE}"`, path: ["value"] });
    }
  });
export type FootprintKey = z.infer<typeof FootprintKey>;

export const keyId = (k: Pick<FootprintKey, "type" | "value">) => `${k.type}:${k.value}`;
