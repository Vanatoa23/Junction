// Database lifecycle for local dev.
//   node scripts/db.mjs up|down|status
// Strategy: if DATABASE_URL is not local, do nothing (Aiven etc.). Else prefer `docker compose`;
// if Docker is not installed, fall back to a private Postgres cluster in .data/pgdata using locally
// installed PostgreSQL binaries (initdb/pg_ctl), on port 5434, trust auth, localhost only.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function loadEnv() {
  const p = join(root, ".env");
  const env = {};
  if (existsSync(p)) for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] !== "") env[m[1]] = m[2];
  }
  return { ...env, ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v)) };
}
const env = loadEnv();
const url = new URL(env.DATABASE_URL ?? "postgres://secondsource:secondsource@localhost:5434/secondsource");
const port = Number(url.port || 5432);
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
const has = (cmd) => spawnSync(cmd, ["--version"], { stdio: "ignore", shell: isWin }).status === 0;

function canConnect() {
  return new Promise((res) => {
    const s = net.connect({ port, host: "127.0.0.1" }, () => { s.end(); res(true); });
    s.on("error", () => res(false));
    s.setTimeout(800, () => { s.destroy(); res(false); });
  });
}

function findPgBin() {
  const cands = [];
  if (isWin) {
    for (const base of ["C:/Program Files/PostgreSQL", "C:/Program Files (x86)/PostgreSQL"]) {
      if (existsSync(base)) for (const v of readdirSync(base).sort().reverse()) cands.push(join(base, v, "bin"));
    }
  } else {
    cands.push("/usr/lib/postgresql/16/bin", "/usr/lib/postgresql/15/bin", "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin");
  }
  return cands.find((d) => existsSync(join(d, isWin ? "pg_ctl.exe" : "pg_ctl")) && existsSync(join(d, isWin ? "initdb.exe" : "initdb")));
}

const dataDir = join(root, ".data", "pgdata");

async function up() {
  if (!isLocal) return console.log(`DATABASE_URL points at ${url.hostname}: not managing it.`);
  if (await canConnect()) return console.log(`Postgres already listening on :${port}`);
  if (has("docker") && existsSync(join(root, "docker-compose.yml")) && spawnSync("docker", ["info"], { stdio: "ignore", shell: isWin }).status === 0) {
    console.log("Starting Postgres with docker compose...");
    if (run("docker", ["compose", "up", "-d", "--wait", "db"], { shell: isWin }).status !== 0) process.exit(1);
    return;
  }
  const bin = findPgBin();
  if (!bin) {
    console.error("No Docker and no local PostgreSQL binaries found. Install Docker Desktop (then `pnpm db:up`) or PostgreSQL 14+.");
    process.exit(1);
  }
  const exe = (n) => join(bin, isWin ? `${n}.exe` : n);
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    console.log(`Docker not available: creating a private local cluster in .data/pgdata using ${bin}`);
    if (run(exe("initdb"), ["-D", dataDir, "-U", url.username || "secondsource", "--auth=trust", "-E", "UTF8"]).status !== 0) process.exit(1);
  }
  // stdio must NOT be inherited: the detached postmaster would keep our pipes open and hang the caller.
  const r = run(exe("pg_ctl"), ["-D", dataDir, "-l", join(root, ".data", "pgdata.log"), "-o", `-p ${port} -c listen_addresses=127.0.0.1`, "-w", "start"], { stdio: "ignore" });
  if (r.status !== 0) { console.error("pg_ctl start failed; see .data/pgdata.log"); process.exit(1); }
  // create the database if missing
  const dbName = url.pathname.slice(1) || "secondsource";
  const q = spawnSync(exe("psql"), ["-h", "127.0.0.1", "-p", String(port), "-U", url.username || "secondsource", "-d", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname='${dbName}'`], { encoding: "utf8" });
  if (!q.stdout.trim()) run(exe("createdb"), ["-h", "127.0.0.1", "-p", String(port), "-U", url.username || "secondsource", dbName]);
}

function down() {
  if (!isLocal) return;
  if (existsSync(join(dataDir, "PG_VERSION"))) {
    const bin = findPgBin();
    if (bin) run(join(bin, isWin ? "pg_ctl.exe" : "pg_ctl"), ["-D", dataDir, "stop", "-m", "fast"]);
  }
  if (has("docker")) run("docker", ["compose", "stop", "db"], { shell: isWin });
}

const cmd = process.argv[2];
if (cmd === "up") await up();
else if (cmd === "down") down();
else if (cmd === "status") console.log((await canConnect()) ? "up" : "down");
else { console.error("usage: db.mjs up|down|status"); process.exit(2); }
