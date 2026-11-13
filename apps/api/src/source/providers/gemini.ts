import { ClassifyOutput } from "@secondsource/shared";
import { config } from "../../config";
import { classifyRuleBased } from "../../seed/classifier";
import type { Provider } from "../types";
import { httpJson } from "./http";

/**
 * Gemini = incident classification ONLY (pass/fail checks are plain code).
 * LIVE only when GEMINI_API_KEY is set; model from GEMINI_MODEL.
 * SEED (no key) = the deterministic rule-based classifier in seed/classifier.ts (NOT an LLM; classifier "rule-based-v1").
 *
 * !! UNVERIFIED !! live() is written from docs/api-findings.md and has never run against the real service.
 * The structured-output request shape is UNSETTLED in the docs: we try the newest documented shape first,
 * and fall back to the older generationConfig.responseJsonSchema shape on a 400.
 *
 * OPS:
 *  classify {text, sourceUrl}  -> ClassifyOutput (packages/shared/src/classify.ts)
 *
 * The CALLER must run verifyQuote(text, quote) (lib/quote.ts). This provider does not.
 */
const SCHEMA = {
  type: "object",
  properties: {
    incident: { type: "boolean" },
    type: { type: "string", enum: ["STRIKE", "FIRE", "RECALL", "SANCTION", "INSOLVENCY", "PORT_CLOSURE", "WEATHER", "CYBER", "OTHER"] },
    severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    title: { type: "string" },
    quote: { type: "string" },
    keys: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["REGION", "PORT", "PLANT", "SANCTION", "PARENT"] },
          value: { type: "string" },
          state: { type: "string", enum: ["CONFIRMED", "INFERRED"] },
          quote: { type: "string" },
        },
        required: ["type", "value", "state"],
      },
    },
    unmappedNames: { type: "array", items: { type: "string" } },
  },
  required: ["incident"],
};

const prompt = (text: string) =>
  `You classify supplier/port notices for supply-chain risk. Decide whether the text announces a disruption incident. ` +
  `If yes return type, severity, a short title, and "quote": ONE sentence copied VERBATIM from the text (do not paraphrase). ` +
  `keys: REGION (ISO 3166-2, e.g. NL-ZH), PORT (UN/LOCODE, e.g. NLRTM), PLANT, SANCTION, PARENT that the incident touches; ` +
  `state CONFIRMED only if named in the text, else INFERRED. List places you cannot map in unmappedNames. ` +
  `If it is not an incident return {"incident": false}.\n\nTEXT:\n${text}`;

function toOutput(raw: any, model: string): ClassifyOutput {
  if (!raw?.incident) return { incident: false, classifier: `gemini:${model}`, reason: "model: not an incident" };
  return ClassifyOutput.parse({
    incident: true, classifier: `gemini:${model}`, type: raw.type, severity: raw.severity, title: raw.title ?? raw.quote,
    quote: raw.quote, keys: (raw.keys ?? []).map((k: any) => ({ ...k, quote: k.quote ?? null })), unmappedNames: raw.unmappedNames ?? [],
  });
}

export const gemini: Provider = {
  name: "gemini",
  hasKey: () => !!config.GEMINI_API_KEY,
  async live(op, p, signal) {
    if (op !== "classify") throw new Error(`gemini.${op} unknown op`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent`;
    const headers = { "x-goog-api-key": config.GEMINI_API_KEY };
    const contents = [{ parts: [{ text: prompt(String(p.text)) }] }];
    type Resp = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    let resp: Resp;
    try {
      resp = await httpJson<Resp>(url, { signal, headers, body: { contents, generationConfig: { responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: SCHEMA } } } } });
    } catch (e) {
      if (!/ 400/.test((e as Error).message)) throw e;
      resp = await httpJson<Resp>(url, { signal, headers, body: { contents, generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCHEMA } } });
    }
    const text = resp.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("gemini returned no text");
    return { data: toOutput(JSON.parse(text), config.GEMINI_MODEL), sourceUrls: p.sourceUrl ? [String(p.sourceUrl)] : [] };
  },
  async seed(op, params) {
    if (op !== "classify") return null;
    return { data: classifyRuleBased(String(params.text ?? "")), sourceUrls: params.sourceUrl ? [String(params.sourceUrl)] : [] };
  },
};
