-- Real-data scenario (additive): ports, supplier sites, and which demo scenario a client runs.
-- Public facts, no client_id. Rows come from committed public packs (mode REC = recorded real data) or are assumptions
-- that are labelled as such in footprint_key.source_quote.
CREATE TABLE port (
  id text PRIMARY KEY,                 -- "<country>-<NAME>", e.g. TW-KAOHSIUNG (names with spaces use "_")
  name text NOT NULL,
  country char(2),
  lat double precision,
  lng double precision,
  source_urls text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'REC' CHECK (mode IN ('LIVE','REC','SEED','LOCAL'))
);

CREATE TABLE site (
  id text PRIMARY KEY,                 -- pack site alias, e.g. Site-0008
  company_id uuid NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  country char(2) NOT NULL,
  city text,
  lat double precision,                -- null = only the country is known (map uses the country centre)
  lng double precision,
  source_url text,
  mode text NOT NULL DEFAULT 'REC' CHECK (mode IN ('LIVE','REC','SEED','LOCAL'))
);
CREATE INDEX site_company_idx ON site (company_id);

-- scenario: "fictional" (default seed) or "cala" (real public pack). demo_* drive the "Test a disruption" control.
ALTER TABLE client
  ADD COLUMN scenario text NOT NULL DEFAULT 'fictional',
  ADD COLUMN demo_notice text,
  ADD COLUMN demo_label text;
