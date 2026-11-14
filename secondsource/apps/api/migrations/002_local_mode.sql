-- Adds mode LOCAL: data produced by our own code against our own host (e.g. fetching and diffing the TEST page).
-- Never used for vendor data. UI shows it as LOCAL.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c
    WHERE c.contype = 'c' AND pg_get_constraintdef(c.oid) LIKE '%mode%LIVE%REC%SEED%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (mode IN (''LIVE'',''REC'',''SEED'',''LOCAL''))', r.tbl, r.conname);
  END LOOP;
END $$;
