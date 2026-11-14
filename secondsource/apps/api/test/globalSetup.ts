import pg from "pg";

/** Recreate <db>_test and point DATABASE_URL at it before any test module (and config.ts) loads. Local DBs only. */
export default async function setup() {
  const base = process.env.DATABASE_URL ?? "postgres://secondsource:secondsource@localhost:5434/secondsource";
  const url = new URL(base);
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) throw new Error("refusing to run tests against a non-local database");
  const name = url.pathname.slice(1).replace(/_test$/, "") + "_test";

  const admin = new pg.Client({ connectionString: base.replace(/\/[^/?]+(\?|$)/, "/postgres$1") });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${name}"`);
  await admin.end();

  url.pathname = `/${name}`;
  process.env.DATABASE_URL = url.toString();
  process.env.DATABASE_SSL = "disable";

  const { migrate } = await import("../src/db/migrate");
  const { seed } = await import("../src/seed/seed");
  const { seedCala } = await import("../src/seed/cala");
  const { pool } = await import("../src/db/pool");
  await migrate(() => {});
  await seed(() => {});
  await seedCala(() => {}); // real-data scenario (skipped when the packs are absent)
  await pool.end();
}
