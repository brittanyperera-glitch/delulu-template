import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Neon's driver speaks its own HTTP protocol and mangles any other host, so pick by URL. */
export function isNeonUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host.endsWith(".neon.tech") || host.includes("neon") || host.endsWith(".vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function makeDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing");
  const d = isNeonUrl(url) ? drizzleNeon(neon(url), { schema }) : drizzleNode(url, { schema });
  return d as unknown as Db;
}

let cached: Db | undefined;
export function db(): Db {
  cached ??= makeDb();
  return cached;
}
