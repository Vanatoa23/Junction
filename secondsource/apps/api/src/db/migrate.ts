import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool";

/** Plain-SQL migration runner: apps/api/migrations/NNN_name.sql, applied once, in order, each in a transaction. */
export async function migrate(log = console.log): Promise<number> {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../../migrations");
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name as string));
  let n = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query(readFileSync(join(dir, f), "utf8"));
      await c.query("INSERT INTO schema_migrations(name) VALUES ($1)", [f]);
      await c.query("COMMIT");
      log(`migrated ${f}`);
      n++;
    } catch (e) {
      await c.query("ROLLBACK");
      throw new Error(`migration ${f} failed: ${(e as Error).message}`);
    } finally {
      c.release();
    }
  }
  return n;
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  migrate()
    .then((n) => { console.log(n ? `${n} migration(s) applied` : "database up to date"); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
