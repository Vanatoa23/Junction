// `pnpm dev`: database -> migrate + seed -> api + worker + web, with prefixed logs.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const sh = { cwd: root, stdio: "inherit", shell: isWin };

if (!existsSync(join(root, ".env")) && existsSync(join(root, ".env.example"))) {
  copyFileSync(join(root, ".env.example"), join(root, ".env"));
  console.log("Created .env from .env.example (no keys: running on SEED/REC).");
}

// `pnpm dev:real` runs the real-data scenario (public Cala packs) instead of the fictional demo company.
// The fictional seed always runs under its own client id; only the running stack switches to the real-data client.
const real = process.argv.includes("--real");
const FICTIONAL_CLIENT = "00000000-0000-4000-8000-000000000001";
const REAL_CLIENT = "00000000-0000-4000-8000-000000000002";

for (const [cmd, args, env] of [
  ["node", ["scripts/db.mjs", "up"], {}],
  ["pnpm", ["--filter", "@secondsource/api", "migrate"], {}],
  ["pnpm", ["--filter", "@secondsource/api", "seed"], { DEMO_CLIENT_ID: FICTIONAL_CLIENT }],
  ...(real ? [["pnpm", ["--filter", "@secondsource/api", "seed:cala"], {}]] : []),
]) {
  const r = spawnSync(cmd, args, { ...sh, env: { ...process.env, ...env } });
  if (r.status !== 0) {
    console.error(`\nStep failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}
if (real) process.env.DEMO_CLIENT_ID = REAL_CLIENT;

console.log("\nAPI http://localhost:3001  |  Web http://localhost:5173  |  TEST page http://localhost:3001/test-notice\n");
const q = (c) => `"${c}"`;
const p = spawn(
  [
    "pnpm exec concurrently -k -n api,worker,web -c cyan,magenta,green",
    q("pnpm --filter @secondsource/api dev"),
    q("pnpm --filter @secondsource/api worker"),
    q("pnpm --filter @secondsource/web dev"),
  ].join(" "),
  { cwd: root, stdio: "inherit", shell: true },
);
p.on("exit", (code) => process.exit(code ?? 0));
