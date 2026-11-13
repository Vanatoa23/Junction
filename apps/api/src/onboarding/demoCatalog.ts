import type { FootprintType, KeyState } from "@secondsource/shared";
import type { SourceName } from "./scoring";

/**
 * ONBOARDING SEED CATALOG. Fictional companies (reserved .example domains) that stand in for what
 * Context.dev / Exa / Cala would know. Every result built from it carries mode SEED and its footprint
 * keys are seeded=true. It is consulted ONLY when a provider answered from seed data (no key), never on top of
 * a LIVE or REC answer, and it is never presented as vendor output.
 *
 * `sources` says which providers "know" the company in the seed world; that drives the source-agreement
 * part of the resolver score the same way real disagreement would.
 *
 * Demo paste list (see DEMO_PASTE_LIST): 10 names. 7 resolve cleanly, 1 is ambiguous (two near-identical
 * companies), 1 is unresolvable by name (needs a domain), 1 comes with a user-typed domain.
 */
export interface CatalogEntry {
  name: string;
  domain: string;
  country: string;
  category: string;
  sources: SourceName[];
  keys: Array<[type: FootprintType, value: string, state?: KeyState]>;
}

export const CATALOG: CatalogEntry[] = [
  { name: "Savonia Dairy Cartons Oy", domain: "savoniacartons.example", country: "FI", category: "packaging", sources: ["contextdev", "cala"],
    keys: [["REGION", "FI-POS"], ["PORT", "FIHEL"], ["PLANT", "savoniacartons-kuopio-1"], ["PARENT", "seed:savonia-group"]] },
  { name: "Kvarken Foils Ab", domain: "kvarkenfoils.example", country: "FI", category: "packaging", sources: ["contextdev", "cala"],
    keys: [["REGION", "FI-POH"], ["PORT", "FIVAA"], ["PLANT", "kvarkenfoils-vaasa-1"], ["PARENT", "seed:kvarken-holding"]] },
  { name: "Rhine Valley Closures GmbH", domain: "rhinevalleyclosures.example", country: "DE", category: "packaging", sources: ["contextdev", "cala"],
    // Rotterdam is INFERRED (the inland lane is assumed), the same pattern as the foundation seed's Antwerp Resins.
    keys: [["REGION", "DE-NW"], ["PORT", "DEDUI"], ["PORT", "NLRTM", "INFERRED"], ["PLANT", "rhinevalleyclosures-duisburg-1"], ["PARENT", "seed:rhine-closures-group"]] },
  { name: "Porvoo Label Works Oy", domain: "porvoolabels.example", country: "FI", category: "labels", sources: ["contextdev", "cala"],
    // Ownership unknown on purpose: stored as the UNKNOWN placeholder, never guessed.
    keys: [["REGION", "FI-UUS"], ["PORT", "FIHEL"], ["PLANT", "porvoolabels-porvoo-1"], ["PARENT", "?", "UNKNOWN"]] },
  { name: "Aarhus Cultures A/S", domain: "aarhuscultures.example", country: "DK", category: "ingredients", sources: ["contextdev", "cala"],
    keys: [["REGION", "DK-82"], ["PORT", "DKAAR"], ["PLANT", "aarhuscultures-aarhus-1"], ["PARENT", "seed:aarhus-bio"]] },
  // Only Exa and Cala know this one in the seed world: Context.dev answers nothing, so Exa is used as the fallback.
  { name: "Gdansk Pallet Systems Sp. z o.o.", domain: "gdanskpallets.example", country: "PL", category: "logistics", sources: ["exa", "cala"],
    keys: [["REGION", "PL-PM"], ["PORT", "PLGDN"], ["PLANT", "gdanskpallets-gdansk-1"], ["PARENT", "seed:pallet-holding"]] },
  { name: "Riga Crate & Pallet SIA", domain: "rigacrates.example", country: "LV", category: "logistics", sources: ["contextdev", "cala"],
    keys: [["REGION", "LV-RIX"], ["PORT", "LVRIX"], ["PLANT", "rigacrates-riga-1"], ["PARENT", "seed:baltic-crates"]] },
  // Ambiguous pair: both Finnish, both known only to Context.dev, names differ by one word.
  { name: "Helsinki Steel Cans Oy", domain: "helsinkisteelcans.example", country: "FI", category: "packaging", sources: ["contextdev"],
    keys: [["REGION", "FI-UUS"], ["PORT", "FIHEL"], ["PLANT", "helsinkisteelcans-vantaa-1"], ["PARENT", "seed:steel-cans-group"]] },
  { name: "Helsinki Steel Can Works Oy", domain: "hsc-works.example", country: "FI", category: "packaging", sources: ["contextdev"],
    keys: [["REGION", "FI-UUS"], ["PORT", "FIKTK"], ["PLANT", "hsc-works-kotka-1"], ["PARENT", "?", "UNKNOWN"]] },
  { name: "Oulu Barrier Films Oy", domain: "oulubarrier.example", country: "FI", category: "packaging", sources: ["contextdev", "cala"],
    keys: [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "oulubarrier-oulu-1"], ["PARENT", "seed:oulu-barrier-group"]] },
  // Findable by DOMAIN only (its trading name is unrelated to what the user types): the "needs a domain" path.
  { name: "Kaleva Trade Oy", domain: "kalevatrade.example", country: "FI", category: "ingredients", sources: ["contextdev"],
    keys: [["REGION", "FI-POH"], ["PORT", "FIOUL"], ["PLANT", "kalevatrade-oulu-1"], ["PARENT", "seed:kaleva-group"]] },
];

/** The paste list for the demo. Names are typed the way people type them (no legal forms, mixed completeness). */
export const DEMO_PASTE_LIST: Array<{ name: string; domain: string | null; country: string | null }> = [
  { name: "Savonia Dairy Cartons", domain: null, country: "FI" },
  { name: "Kvarken Foils", domain: null, country: null },
  { name: "Rhine Valley Closures GmbH", domain: null, country: "DE" },
  { name: "Porvoo Label Works", domain: null, country: "FI" },
  { name: "Aarhus Cultures A/S", domain: null, country: "DK" },
  { name: "Gdansk Pallet Systems", domain: null, country: "PL" },
  { name: "Riga Crate and Pallet", domain: null, country: "LV" },
  { name: "Helsinki Steel Cans", domain: null, country: null }, // AMBIGUOUS: chooser
  { name: "Northwind Industrial Fasteners", domain: null, country: "FI" }, // UNRESOLVED: supply a domain (try kalevatrade.example)
  { name: "Oulu Barrier Films", domain: "oulubarrier.example", country: "FI" }, // user-typed domain
];

export const catalogByDomain = (domain: string) => CATALOG.find((c) => c.domain === domain) ?? null;
