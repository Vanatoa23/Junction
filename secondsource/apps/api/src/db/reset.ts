import { config } from "../config";
import { pool } from "./pool";
import { migrate } from "./migrate";
import { seed } from "../seed/seed";

/** DEV ONLY: drops everything in the public schema, re-migrates and re-seeds. Refuses non-local databases. */
const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(config.DATABASE_URL);
if (!local) {
  console.error("refusing to reset a non-local database");
  process.exit(1);
}
await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
await migrate();
await seed();
await pool.end();
