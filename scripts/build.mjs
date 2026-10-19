import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** A preview build holds the production DATABASE_URL, so migrating there would ship unmerged schema. */
export function shouldMigrate(env) {
  return env.VERCEL_ENV !== "preview";
}

function run(args) {
  const r = spawnSync("pnpm", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (shouldMigrate(process.env)) run(["exec", "drizzle-kit", "migrate"]);
  else console.log("Skipping migrations: preview builds must not change the production database.");
  run(["exec", "next", "build"]);
}
