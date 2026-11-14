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

for (const [cmd, args] of [
  ["node", ["scripts/db.mjs", "up"]],
  ["pnpm", ["--filter", "@secondsource/api", "migrate"]],
  ["pnpm", ["--filter", "@secondsource/api", "seed"]],
]) {
  const r = spawnSync(cmd, args, sh);
  if (r.status !== 0) {
    console.error(`\nStep failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

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
