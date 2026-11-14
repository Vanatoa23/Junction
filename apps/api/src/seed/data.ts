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

export const DEMO_CLIENT_NAME = "Demo Dairy Oy";

/** Deterministic ids so seeding is idempotent and tests can reference rows. */
export const uid = (kind: "company" | "edge", n: number) =>
  `${kind === "company" ? "10000000" : "20000000"}-0000-4000-8000-${String(n).padStart(12, "0")}`;

type K = [type: FootprintType, value: string, state?: KeyState];

export interface SeedCompany {
  n: number;
  /** City (placed on the map via the shared gazetteer). */
  city?: string;
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
  { n: 1, city: "Dusseldorf", name: "Nordpack Packaging", legalName: "Nordpack Packaging GmbH", domain: "nordpack.example", country: "DE", category: "packaging", supplier: true,
    keys: [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "nordpack-duesseldorf-1"], ["PARENT", "seed:pack-holding"]] },
  { n: 2, city: "Vantaa", name: "Baltic Carton", legalName: "Baltic Carton Oy", domain: "balticcarton.example", country: "FI", category: "packaging", supplier: true,
    keys: [["REGION", "FI-UUS"], ["PORT", "FIHEL"], ["PLANT", "balticcarton-vantaa-1"], ["PARENT", "seed:baltic-group"]] },
  { n: 3, city: "Rotterdam", name: "Rhine Foils", legalName: "Rhine Foils B.V.", domain: "rhinefoils.example", country: "NL", category: "packaging", supplier: true,
    keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "rhinefoils-rotterdam-1"], ["PARENT", "seed:rhine-group"]] },
  { n: 4, city: "Tampere", name: "Fennia Cultures", legalName: "Fennia Cultures Oy", domain: "fenniacultures.example", country: "FI", category: "ingredients", supplier: true,
    keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "fennia-tampere-1"], ["PARENT", "seed:fennia-bio"]] },
  { n: 5, city: "Ballerup", name: "Danish Enzymes", legalName: "Danish Enzymes A/S", domain: "danishenzymes.example", country: "DK", category: "ingredients", supplier: true,
    keys: [["REGION", "DK-84"], ["PORT", "DKCPH"], ["PLANT", "danishenzymes-ballerup-1"], ["PARENT", "seed:enzyme-holding"]] },
  { n: 6, city: "Hamburg", name: "Hansa Labels", legalName: "Hansa Labels GmbH", domain: "hansalabels.example", country: "DE", category: "labels", supplier: true,
    keys: [["REGION", "DE-HH"], ["PORT", "DEHAM"], ["PLANT", "hansalabels-hamburg-1"], ["PARENT", "seed:hansa-print"]] },
  { n: 7, city: "Oulu", name: "Oulu Plastics", legalName: "Oulu Plastics Oy", domain: "ouluplastics.example", country: "FI", category: "packaging", supplier: true,
    keys: [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "ouluplastics-oulu-1"], ["PARENT", "seed:oulu-group"]] },
  { n: 8, city: "Antwerp", name: "Antwerp Resins", legalName: "Antwerp Resins NV", domain: "antwerpresins.example", country: "BE", category: "materials", supplier: true,
    // Rotterdam is INFERRED (lane assumed from the inland route), not confirmed: shows the INFERRED state.
    keys: [["REGION", "BE-VAN"], ["PORT", "BEANR"], ["PORT", "NLRTM", "INFERRED"], ["PLANT", "antwerpresins-antwerp-1"], ["PARENT", "seed:resin-holding"]] },
  { n: 9, city: "Molndal", name: "Gothenburg Crates", legalName: "Gothenburg Crates AB", domain: "gbgcrates.example", country: "SE", category: "logistics", supplier: true,
    keys: [["REGION", "SE-O"], ["PORT", "SEGOT"], ["PLANT", "gbgcrates-molndal-1"], ["PARENT", "seed:crate-holding"]] },
  { n: 10, city: "Tallinn", name: "Tallinn Caps", legalName: "Tallinn Caps OÜ", domain: "tallinncaps.example", country: "EE", category: "packaging", supplier: true,
    // Ports unknown on purpose: shows UNKNOWN placeholder handling.
    keys: [["REGION", "EE-37"], ["PORT", "?", "UNKNOWN"], ["PLANT", "tallinncaps-tallinn-1"], ["PARENT", "seed:caps-holding"]] },

  // ---- candidate pool (alternatives for packaging)
  { n: 101, city: "Karlstad", name: "Karlstad Pack", legalName: "Karlstad Pack AB", domain: "karlstadpack.example", country: "SE", category: "packaging", pool: true,
    // Everything known, disjoint from NL-ZH/NLRTM and from Nordpack's parent -> VERIFIED.
    keys: [["REGION", "SE-S"], ["PORT", "SEGOT"], ["PLANT", "karlstadpack-karlstad-1"], ["PARENT", "seed:karlstad-group"]] },
  { n: 102, city: "Rotterdam", name: "Maasvlakte Wrap", legalName: "Maasvlakte Wrap B.V.", domain: "maasvlaktewrap.example", country: "NL", category: "packaging", pool: true,
    // Same port and region as the incident -> FAILED on C1 and C2.
    keys: [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "maasvlaktewrap-rotterdam-1"], ["PARENT", "seed:maas-group"]] },
  { n: 103, city: "Tampere", name: "Tampere Board", legalName: "Tampere Board Oy", domain: "tampereboard.example", country: "FI", category: "packaging", pool: true,
    // Parent ownership unknown -> UNVERIFIED on C5, nothing fails.
    keys: [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "tampereboard-tampere-1"], ["PARENT", "?", "UNKNOWN"]] },
  { n: 104, city: "Lodz", name: "Lodz Pack", legalName: "Lodz Pack Sp. z o.o.", domain: "lodzpack.example", country: "PL", category: "packaging", pool: true,
    // Disjoint geography, but the SAME parent as Nordpack -> FAILED on C5.
    keys: [["REGION", "PL-LD"], ["PORT", "PLGDN"], ["PLANT", "lodzpack-lodz-1"], ["PARENT", "seed:pack-holding"]] },
];

/** Tier-2: the candidates' own suppliers (used by C3). [buyer company n, supplier company n]. */
export const SEED_UPSTREAM: Array<{ n: number; buyerN: number; tier?: 2 | 3; city?: string; name: string; legalName: string; domain: string; country: string; keys: K[] }> = [
  { n: 201, buyerN: 101, city: "Karlstad", name: "Varmland Pulp", legalName: "Varmland Pulp AB", domain: "varmlandpulp.example", country: "SE",
    keys: [["REGION", "SE-S"], ["PLANT", "varmlandpulp-karlstad-1"]] },
  { n: 202, buyerN: 103, city: "Kouvola", name: "Kymi Pulp", legalName: "Kymi Pulp Oy", domain: "kymipulp.example", country: "FI",
    keys: [["REGION", "FI-KYM"], ["PLANT", "kymipulp-kouvola-1"]] },
];

export const DEFAULT_NOTICE_TEXT =
  "Supplier and port notices. No active disruptions are listed. All monitored ports operate normally.";

/** Text to paste into the TEST page to trigger the demo incident (also in DEMO.md). */
export const DEMO_TRIGGER_TEXT =
  "NOTICE: Strike action at the Port of Rotterdam (NLRTM, region NL-ZH). All container terminals are closed until further notice. Inbound and outbound cargo is delayed.";

/**
 * Deeper tiers of the 10 direct suppliers (tier 2 = their suppliers, tier 3 = theirs). NEVER drawn on the map:
 * the backend uses them only to score risk ("2 of its own suppliers ship through Rotterdam").
 * Fictional, SEEDED. Tier 3 `buyerN` is a tier-2 company n. Tallinn Caps (10) has none on purpose: coverage "limited".
 */
const D = (n: number, buyerN: number, tier: 2 | 3, city: string, country: string, name: string, keys: K[]) => ({
  n, buyerN, tier, city, name, legalName: name, domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`, country, keys,
});
export const SEED_DEEP = [
  D(301, 1, 2, "Duisburg", "DE", "Rhenish Pulp GmbH", [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "rhenishpulp-duisburg-1"]]),
  D(302, 1, 2, "Mainz", "DE", "Eifel Adhesives GmbH", [["REGION", "DE-RP"], ["PORT", "DEHAM"], ["PLANT", "eifeladhesives-mainz-1"]]),
  D(303, 301, 3, "Gothenburg", "SE", "Scandi Fibre Trading AB", [["REGION", "SE-O"], ["PORT", "SEGOT"]]),
  D(304, 2, 2, "Kouvola", "FI", "Kymi Board Mill Oy", [["REGION", "FI-KYM"], ["PORT", "FIHAM"], ["PORT", "NLRTM", "INFERRED"], ["PLANT", "kymiboard-kouvola-1"]]),
  D(305, 2, 2, "Kuopio", "FI", "Savo Fibre Oy", [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "savofibre-kuopio-1"]]),
  D(306, 3, 2, "Rotterdam", "NL", "Delta Polymers B.V.", [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "deltapolymers-rotterdam-1"]]),
  D(307, 3, 2, "Duisburg", "DE", "Ruhr Chemicals GmbH", [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "ruhrchem-duisburg-1"]]),
  D(308, 306, 3, "Rotterdam", "NL", "Gulf Resin Imports B.V.", [["REGION", "NL-ZH"], ["PORT", "NLRTM"]]),
  D(309, 4, 2, "Tampere", "FI", "Nordic Dairy Coop Oy", [["REGION", "FI-PIR"], ["PORT", "FIHEL"], ["PLANT", "nordicdairy-tampere-1"]]),
  D(310, 4, 2, "Hamburg", "DE", "Baltic Packaging Film GmbH", [["REGION", "DE-HH"], ["PORT", "DEHAM"], ["PLANT", "balticfilm-hamburg-1"]]),
  D(311, 5, 2, "Aarhus", "DK", "Jutland Biotech A/S", [["REGION", "DK-82"], ["PORT", "DKAAR"], ["PLANT", "jutlandbiotech-aarhus-1"]]),
  D(312, 5, 2, "Antwerp", "BE", "Antwerp Fermentation NV", [["REGION", "BE-VAN"], ["PORT", "BEANR"], ["PLANT", "antwerpferm-antwerp-1"]]),
  D(313, 6, 2, "Rotterdam", "NL", "Rotterdam Inks B.V.", [["REGION", "NL-ZH"], ["PORT", "NLRTM"], ["PLANT", "rotterdamink-rotterdam-1"]]),
  D(314, 6, 2, "Hamburg", "DE", "Elbe Paper GmbH", [["REGION", "DE-HH"], ["PORT", "DEHAM"], ["PLANT", "elbepaper-hamburg-1"]]),
  D(315, 7, 2, "Oulu", "FI", "Polar Granules Oy", [["REGION", "FI-POS"], ["PORT", "FIOUL"], ["PLANT", "polargranules-oulu-1"]]),
  D(316, 8, 2, "Antwerp", "BE", "Port Chemicals NV", [["REGION", "BE-VAN"], ["PORT", "BEANR"], ["PLANT", "portchem-antwerp-1"]]),
  D(317, 8, 2, "Duisburg", "DE", "Rhine Feedstock GmbH", [["REGION", "DE-NW"], ["PORT", "NLRTM"], ["PLANT", "rhinefeed-duisburg-1"]]),
  D(318, 9, 2, "Vaxjo", "SE", "Smaland Timber AB", [["REGION", "SE-F"], ["PORT", "SEGOT"], ["PLANT", "smalandtimber-vaxjo-1"]]),
];
