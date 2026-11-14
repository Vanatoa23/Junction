-- A null parent represents a direct dependency. Index it like any other parent.
CREATE UNIQUE INDEX supplier_dependency_identity_idx ON supplier_dependency
  (client_id, edge_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, match_key);
-- Keep historical alert and approval references intact while consolidating duplicate imports.
WITH ranked AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY client_id, company_id ORDER BY created_at, id
  ) AS canonical_id
  FROM supplier_edge
  WHERE tier = 1 AND company_id IS NOT NULL
)
UPDATE supplier_edge AS edge
SET duplicate_of = ranked.canonical_id
FROM ranked
WHERE edge.id = ranked.id AND ranked.id <> ranked.canonical_id;
