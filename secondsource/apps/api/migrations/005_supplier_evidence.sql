ALTER TABLE supplier_edge
  ADD COLUMN duplicate_of uuid REFERENCES supplier_edge(id) ON DELETE SET NULL,
  ADD CONSTRAINT supplier_edge_client_id_id_uq UNIQUE (client_id, id);

CREATE TABLE supplier_dependency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  edge_id uuid NOT NULL,
  parent_id uuid,
  kind text NOT NULL CHECK (kind IN ('PORT', 'PLANT', 'SUPPLIER')),
  name text NOT NULL,
  match_key text NOT NULL,
  source text NOT NULL,
  source_url text,
  confidence text NOT NULL CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  verified_on date NOT NULL,
  UNIQUE (client_id, edge_id, id),
  FOREIGN KEY (client_id, edge_id) REFERENCES supplier_edge(client_id, id) ON DELETE CASCADE,
  FOREIGN KEY (client_id, edge_id, parent_id) REFERENCES supplier_dependency(client_id, edge_id, id) ON DELETE CASCADE
);
