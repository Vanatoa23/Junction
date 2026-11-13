/**
 * SEED DATA. Everything here is fictional and labelled SEEDED / mode SEED in the
 * database and UI. Domains use the reserved .example TLD on purpose: nothing
 * here may be mistaken for a real company or real evidence.
 *
 * Demo story (see DEMO.md later): the TEST notice page announces a strike at
 * the Port of Rotterdam (UN/LOCODE NLRTM, region NL-ZH). Suppliers 1, 3 and 8
 * touch NLRTM -> 3 alerts. Alternatives for Nordpack: one FAILS (shares
 * NLRTM and the same parent), one is UNVERIFIED (parent unknown), one is
 * VERIFIED (everything known and disjoint).
 */
import type { FootprintType, KeyState } from "@secondsource/shared";

export const DEMO_CLIENT_NAME = "Demo Dairy Oy (SEEDED demo client)";

/** Deterministic ids so seeding is idempotent and tests can reference rows. */
export const uid = (kind: "company" | "edge", n: number) =>
  `${kind === "company" ? "10000000" : "20000000"}-0000-4000-8000-${String(n).padStart(12, "0")}`;

type K = [type: FootprintType, value: string, state?: KeyState];

export interface SeedCompany {
  n: number;
  name: string;
  legalName: string;
  domain: string;
  country: string;
  category: string;
  /** Part of the client's supplier list (tier 1). */
  supplier?: boolean;
  /** In the alternatives candidate pool. */
  pool?: boolean;
  keys: K[];
}

export const SEED_COMPANIES: SeedCompany[] = [
  // ---- client suppliers (tier 1)
  { n: 1, name: "Nordpack Packaging", legalName: "Nordpack Packaging GmbH", domain: "nordpack.example", country: "DE", category: "packaging", supplier: true,
    keys: [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "nordpack-duesseldorf-1"], ["PARENT", "seed:pack-holding"]] },
  { n: 2, name: "Baltic Carton", legalName: "Baltic Carton Oy", domain: "balticcarton.example", country: "FI", category: "packaging", supplier: true,
    keys: [["REGION", "FI-UUS"], ["PORT", "FIHEL"], ["PLANT", "balticcarton-vantaa-1"], ["PARENT", "seed:baltic-group"]] },
  { n: 3, name: "Rhine Foils", legalName: "Rhine Foils B.V.", domain: "rhinefoils.example", country: "NL", category: "packaging", supplier: true,
    keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "rhinefoils-rotterdam-1"], ["PARENT", "seed:rhine-group"]] },
  { n: 4, name: "Fennia Cultures", legalName: "Fennia Cultures Oy", domain: "fenniacultures.example", country: "FI", category: "ingredients", supplier: true,
    keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "fennia-tampere-1"], ["PARENT", "seed:fennia-bio"]] },
  { n: 5, name: "Danish Enzymes", legalName: "Danish Enzymes A/S", domain: "danishenzymes.example", country: "DK", category: "ingredients", supplier: true,
    keys: [["REGION", "DK-84"], ["PORT", "DKCPH"], ["PLANT", "danishenzymes-ballerup-1"], ["PARENT", "seed:enzyme-holding"]] },
  { n: 6, name: "Hansa Labels", legalName: "Hansa Labels GmbH", domain: "hansalabels.example", country: "DE", category: "labels", supplier: true,
    keys: [["REGION", "DE-HH"], ["PORT", "DEHAM"], ["PLANT", "hansalabels-hamburg-1"], ["PARENT", "seed:hansa-print"]] },
  { n: 7, name: "Oulu Plastics", legalName: "Oulu Plastics Oy", domain: "ouluplastics.example", country: "FI", category: "packaging", supplier: true,
    keys: [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "ouluplastics-oulu-1"], ["PARENT", "seed:oulu-group"]] },
  { n: 8, name: "Antwerp Resins", legalName: "Antwerp Resins NV", domain: "antwerpresins.example", country: "BE", category: "materials", supplier: true,
    // Rotterdam is INFERRED (lane assumed from the inland route), not confirmed: shows the INFERRED state.
    keys: [["REGION", "BE-VAN"], ["PORT", "BEANR"], ["PORT", "NLRTM", "INFERRED"], ["PLANT", "antwerpresins-antwerp-1"], ["PARENT", "seed:resin-holding"]] },
  { n: 9, name: "Gothenburg Crates", legalName: "Gothenburg Crates AB", domain: "gbgcrates.example", country: "SE", category: "logistics", supplier: true,
    keys: [["REGION", "SE-O"], ["PORT", "SEGOT"], ["PLANT", "gbgcrates-molndal-1"], ["PARENT", "seed:crate-holding"]] },
  { n: 10, name: "Tallinn Caps", legalName: "Tallinn Caps OÜ", domain: "tallinncaps.example", country: "EE", category: "packaging", supplier: true,
    // Ports unknown on purpose: shows UNKNOWN placeholder handling.
    keys: [["REGION", "EE-37"], ["PORT", "?", "UNKNOWN"], ["PLANT", "tallinncaps-tallinn-1"], ["PARENT", "seed:caps-holding"]] },

  // ---- candidate pool (alternatives for packaging)
  { n: 101, name: "Karlstad Pack", legalName: "Karlstad Pack AB", domain: "karlstadpack.example", country: "SE", category: "packaging", pool: true,
    // Everything known, disjoint from NL-ZH/NLRTM and from Nordpack's parent -> VERIFIED.
    keys: [["REGION", "SE-S"], ["PORT", "SEGOT"], ["PLANT", "karlstadpack-karlstad-1"], ["PARENT", "seed:karlstad-group"]] },
  { n: 102, name: "Maasvlakte Wrap", legalName: "Maasvlakte Wrap B.V.", domain: "maasvlaktewrap.example", country: "NL", category: "packaging", pool: true,
    // Same port and region as the incident -> FAILED on C1 and C2.
    keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "maasvlaktewrap-rotterdam-1"], ["PARENT", "seed:maas-group"]] },
  { n: 103, name: "Tampere Board", legalName: "Tampere Board Oy", domain: "tampereboard.example", country: "FI", category: "packaging", pool: true,
    // Parent ownership unknown -> UNVERIFIED on C5, nothing fails.
    keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "tampereboard-tampere-1"], ["PARENT", "?", "UNKNOWN"]] },
  { n: 104, name: "Lodz Pack", legalName: "Lodz Pack Sp. z o.o.", domain: "lodzpack.example", country: "PL", category: "packaging", pool: true,
    // Disjoint geography, but the SAME parent as Nordpack -> FAILED on C5.
    keys: [["REGION", "PL-LD"], ["PORT", "PLGDN"], ["PLANT", "lodzpack-lodz-1"], ["PARENT", "seed:pack-holding"]] },
];

/** Tier-2: the candidates' own suppliers (used by C3). [buyer company n, supplier company n]. */
export const SEED_UPSTREAM: Array<{ n: number; buyerN: number; name: string; legalName: string; domain: string; country: string; keys: K[] }> = [
  { n: 201, buyerN: 101, name: "Varmland Pulp", legalName: "Varmland Pulp AB", domain: "varmlandpulp.example", country: "SE",
    keys: [["REGION", "SE-S"], ["PLANT", "varmlandpulp-karlstad-1"]] },
  { n: 202, buyerN: 103, name: "Kymi Pulp", legalName: "Kymi Pulp Oy", domain: "kymipulp.example", country: "FI",
    keys: [["REGION", "FI-KYM"], ["PLANT", "kymipulp-kouvola-1"]] },
];

export const DEFAULT_NOTICE_TEXT =
  "Supplier and port notices. No active disruptions are listed. All monitored ports operate normally.";

/** Text to paste into the TEST page to trigger the demo incident (also in DEMO.md). */
export const DEMO_TRIGGER_TEXT =
  "NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.";
