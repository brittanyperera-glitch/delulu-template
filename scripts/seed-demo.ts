import { config } from "dotenv";

// Same loading as drizzle.config.ts: .env.local wins over .env, neither overrides the shell.
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  if (process.env.DEMO_MODE !== "1" && !process.argv.includes("--force")) {
    throw new Error("Refusing to seed: set DEMO_MODE=1 or pass --force.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  // Imported late so DATABASE_URL is loaded before the client module is used.
  const { db } = await import("../src/lib/db/client");
  const { seedDemo, tableCounts } = await import("../src/lib/repo/demo-seed");
  const reset = process.argv.includes("--reset");
  console.log("before", await tableCounts(db()));
  const { seeded } = await seedDemo(db(), new Date(), { reset });
  console.log(seeded ? "seeded" : "skipped: a season already exists (use --reset to wipe)");
  console.log("after", await tableCounts(db()));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
