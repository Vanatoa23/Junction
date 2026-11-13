-- SecondSource core schema. CONTRACT: changes only through the integrator, as NEW numbered migrations.
-- Conventions: uuid pks, timestamptz, text enums via CHECK. Private tables carry client_id (NOT NULL, FK).
-- Public fact tables (company, footprint_key, event, incident, test_notice) are shared across clients.
-- Row-level security is NOT enabled in the MVP; client_id is there so it can be added without a rewrite.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE client (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- public facts
CREATE TABLE company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  domain text UNIQUE,
  country char(2),
  category text,
  cala_id text,
  parent_company_id uuid REFERENCES company(id),
  in_candidate_pool boolean NOT NULL DEFAULT false,
  seeded boolean NOT NULL DEFAULT false,
  mode text NOT NULL CHECK (mode IN ('LIVE','REC','SEED')),
  source_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_pool_idx ON company (in_candidate_pool) WHERE in_candidate_pool;

-- Exactly one owner: a company OR an incident.
CREATE TABLE footprint_key (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company(id) ON DELETE CASCADE,
  incident_id uuid,  -- FK added after incident table exists
  type text NOT NULL CHECK (type IN ('REGION','PORT','PLANT','SANCTION','PARENT')),
  value text NOT NULL,
  state text NOT NULL CHECK (state IN ('CONFIRMED','INFERRED','UNKNOWN')),
  source_url text,
  source_quote text,
  seeded boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'SEED' CHECK (mode IN ('LIVE','REC','SEED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((company_id IS NOT NULL) <> (incident_id IS NOT NULL)),
  CHECK (state = 'UNKNOWN' OR seeded OR source_url IS NOT NULL),
  CHECK (state <> 'UNKNOWN' OR value = '?')
);
CREATE UNIQUE INDEX footprint_company_uq ON footprint_key (company_id, type, value) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX footprint_incident_uq ON footprint_key (incident_id, type, value) WHERE incident_id IS NOT NULL;
CREATE INDEX footprint_lookup_idx ON footprint_key (type, value);

CREATE TABLE event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  via text NOT NULL CHECK (via IN ('WEBHOOK','POLL','NEWS')),
  source_url text NOT NULL,
  monitor_ref text,                 -- Context.dev monitor id, if any
  mode text NOT NULL CHECK (mode IN ('LIVE','REC','SEED')),
  status text NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','CLASSIFIED','DROPPED','INCIDENT')),
  drop_reason text,
  is_test boolean NOT NULL DEFAULT false,
  content_hash text,
  fetched_text text,                -- the text the quote check runs against
  raw jsonb,                        -- webhook body / scrape response as received
  t_source timestamptz,
  t_received timestamptz,
  t_classified timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_created_idx ON event (created_at DESC);

CREATE TABLE incident (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id),
  type text NOT NULL CHECK (type IN ('STRIKE','FIRE','RECALL','SANCTION','INSOLVENCY','PORT_CLOSURE','WEATHER','CYBER','OTHER')),
  severity text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  title text NOT NULL,
  quote text NOT NULL,
  quote_verified boolean NOT NULL CHECK (quote_verified),   -- rows only exist if the code check passed
  source_url text NOT NULL,
  confirmation text NOT NULL DEFAULT 'UNCONFIRMED' CHECK (confirmation IN ('CONFIRMED','UNCONFIRMED')),
  unmapped_names text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL CHECK (mode IN ('LIVE','REC','SEED')),
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE footprint_key ADD CONSTRAINT footprint_incident_fk FOREIGN KEY (incident_id) REFERENCES incident(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------- client-private
-- A row per pasted supplier. company_id is NULL until resolved. buyer_company_id NULL = the client itself (tier 1).
CREATE TABLE supplier_edge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id),
  buyer_company_id uuid REFERENCES company(id),
  company_id uuid REFERENCES company(id),
  tier int NOT NULL DEFAULT 1,
  input_name text NOT NULL,
  input_domain text,
  input_country text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RESOLVED','AMBIGUOUS','UNRESOLVED','MONITORED')),
  resolve_score numeric(4,3),
  resolve_options jsonb NOT NULL DEFAULT '[]',   -- ResolveOption[] while AMBIGUOUS
  monitors jsonb NOT NULL DEFAULT '[]',          -- [{url, kind: WEBHOOK|POLL, ref?}]
  seeded boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'SEED' CHECK (mode IN ('LIVE','REC','SEED')),
  source_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX supplier_edge_client_idx ON supplier_edge (client_id, tier);
CREATE INDEX supplier_edge_company_idx ON supplier_edge (company_id);

CREATE TABLE alert (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id),
  incident_id uuid NOT NULL REFERENCES incident(id),
  edge_id uuid NOT NULL REFERENCES supplier_edge(id),
  matched_keys jsonb NOT NULL,          -- [{incident: FootprintKey, supplier: FootprintKey}]
  t_alert timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, incident_id, edge_id)
);
CREATE INDEX alert_client_idx ON alert (client_id, created_at DESC);

CREATE TABLE candidate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id),
  incident_id uuid NOT NULL REFERENCES incident(id),
  for_edge_id uuid NOT NULL REFERENCES supplier_edge(id),
  company_id uuid NOT NULL REFERENCES company(id),
  verdict text NOT NULL DEFAULT 'UNVERIFIED' CHECK (verdict IN ('VERIFIED','UNVERIFIED','FAILED')),
  rank int,
  status text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED','APPROVED','REJECTED')),
  mode text NOT NULL CHECK (mode IN ('LIVE','REC','SEED')),
  seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, incident_id, for_edge_id, company_id)
);

CREATE TABLE check_result (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id),
  candidate_id uuid NOT NULL REFERENCES candidate(id) ON DELETE CASCADE,
  check_id text NOT NULL CHECK (check_id IN ('C1','C2','C3','C4','C5','LIVE_NEWS')),
  status text NOT NULL CHECK (status IN ('PASS','FAIL','UNKNOWN')),
  reason text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]',   -- Evidence[]
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, check_id)
);

-- Append-only: never UPDATE or DELETE rows here.
CREATE TABLE approval_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id),
  candidate_id uuid NOT NULL REFERENCES candidate(id),
  actor text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVE','REJECT')),
  note text,
  snapshot jsonb NOT NULL,                -- {verdict, checks: CheckResult[]} at decision time
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- queue
CREATE TABLE job (
  id bigserial PRIMARY KEY,
  client_id uuid REFERENCES client(id),   -- nullable: some jobs are public (e.g. poll a shared page)
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  run_after timestamptz NOT NULL DEFAULT now(),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX job_claim_idx ON job (run_after, id) WHERE status = 'queued';

-- ---------------------------------------------------------------- TEST notice page (single row)
CREATE TABLE test_notice (
  id int PRIMARY KEY CHECK (id = 1),
  text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
