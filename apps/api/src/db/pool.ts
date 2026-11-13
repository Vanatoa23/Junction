import pg from "pg";
import { config } from "../config";

// Postgres returns int8 as string by default; ids/counters here fit in JS numbers.
pg.types.setTypeParser(20, (v) => Number(v));

/** Single pool per process. Aiven = change DATABASE_URL (+ DATABASE_SSL=require). Nothing else. */
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export type Queryable = Pick<pg.Pool, "query">;

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Dedicated (non-pooled) connection for LISTEN. */
export async function listenClient(): Promise<pg.Client> {
  const c = new pg.Client({
    connectionString: config.DATABASE_URL,
    ssl: config.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : undefined,
  });
  await c.connect();
  return c;
}
