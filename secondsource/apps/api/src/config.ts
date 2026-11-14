import { z } from "zod";

/** Env-only configuration. Loaded once; the app runs with every key empty. */
const Env = z.object({
  DATABASE_URL: z.string().default("postgres://secondsource:secondsource@localhost:5434/secondsource"),
  DATABASE_SSL: z.enum(["disable", "require"]).default("disable"),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:3001"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  DEMO_CLIENT_ID: z.string().uuid().default("00000000-0000-4000-8000-000000000001"),
  SOURCE_MODE: z.enum(["auto", "rec", "seed"]).default("auto"),
  SOURCE_RECORD: z.enum(["0", "1"]).default("0"),
  SOURCE_TIMEOUT_MS: z.coerce.number().default(8000),
  CONTEXT_DEV_API_KEY: z.string().default(""),
  CONTEXT_DEV_WEBHOOK_SECRET: z.string().default(""),
  EXA_API_KEY: z.string().default(""),
  CALA_API_KEY: z.string().default(""),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  WORKER_POLL_MS: z.coerce.number().default(1000),
});

// Treat empty strings from .env as unset so defaults apply.
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
export const config = Env.parse(raw);
export type Config = typeof config;
