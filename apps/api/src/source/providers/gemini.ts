import { config } from "../../config";
import { NotImplementedError, type Provider } from "../types";

/**
 * Gemini (classification + extraction ONLY; pass/fail checks are plain code).
 * Auth: `x-goog-api-key`. Model from GEMINI_MODEL. Request shape is UNSETTLED (see
 * docs/api-findings.md): prefer the @google/genai SDK or try generationConfig.responseJsonSchema.
 *
 * OPS:
 *  classify {text, sourceUrl}   -> {type, severity, quote, keys[], unmappedNames[]}   [Engine]
 *  extract  {text, sourceUrl, want: "footprint"}  -> keys with quotes                 [Onboarding]
 *
 * RULE: the `quote` must be verified as a substring of the source text IN CODE
 * (whitespace-normalised) by the caller; if not, drop the event and log.
 * No seed: a classification is never faked. REC fixtures may exist for replay.
 */
export const gemini: Provider = {
  name: "gemini",
  hasKey: () => !!config.GEMINI_API_KEY,
  async live(op) {
    throw new NotImplementedError(`gemini.${op} live call`);
  },
  async seed() {
    return null;
  },
};
