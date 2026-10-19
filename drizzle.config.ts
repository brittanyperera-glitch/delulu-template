import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read env files on its own, and without this it silently
// falls back to the placeholder below and the migration fails with no message.
// dotenv never overrides a value already set, so .env.local wins over .env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://placeholder" },
});
