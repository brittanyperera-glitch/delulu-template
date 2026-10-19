import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV = ".env.local";
const PLACEHOLDER_DB = "user:password@host";

if (!existsSync(ENV)) {
  copyFileSync(".env.example", ENV);
  const secret = randomBytes(32).toString("base64");
  const text = readFileSync(ENV, "utf8").replace(
    /^SESSION_SECRET=.*$/m,
    () => `SESSION_SECRET=${secret}`,
  );
  writeFileSync(ENV, text);
  console.log(`Created ${ENV} with a fresh SESSION_SECRET.`);
}

const text = readFileSync(ENV, "utf8");
const db = text.match(/^DATABASE_URL=(.*)$/m)?.[1] ?? "";
if (!db || db.includes(PLACEHOLDER_DB)) {
  console.log(
    `Edit ${ENV}: set DATABASE_URL and replace the change-me GROUP_CODE with your own long passcode (the app refuses to start on the placeholder), then run "pnpm run setup" again to migrate.`,
  );
  process.exit(0);
}

const r = spawnSync("pnpm", ["db:migrate"], { stdio: "inherit" });
process.exit(r.status ?? 1);
