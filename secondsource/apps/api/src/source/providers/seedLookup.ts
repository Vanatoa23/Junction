import { SEED_COMPANIES, SEED_UPSTREAM } from "../../seed/data";

/** Shared helpers for seed providers: look up the fictional seed companies. */
export const allSeedCompanies = () => [...SEED_COMPANIES, ...SEED_UPSTREAM.map((u) => ({ ...u, category: "upstream" }))];

export function findSeed(query: string | undefined, domain?: string | undefined) {
  const q = (query ?? "").trim().toLowerCase();
  const d = (domain ?? "").trim().toLowerCase();
  return allSeedCompanies().filter(
    (c) => (d && c.domain === d) || (q && (c.name.toLowerCase().includes(q) || c.legalName.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()))),
  );
}

export const parentOf = (c: { keys: Array<[string, string, string?]> }) => c.keys.find(([t]) => t === "PARENT")?.[1] ?? null;
