import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { startSeason } from "@/lib/repo/seasons";
import type { Db } from "./client";
import * as schema from "./schema";
import { TEST_MEMBERS } from "./test-members";

export { currentSeason } from "@/lib/repo/seasons";
export { TEST_MEMBERS };

/** The date the tests reckon their day numbers from. Changing it moves every expected day. */
export const TEST_DAY_ONE = "2026-09-02";

/**
 * Migrate once for the whole run, then clone per test.
 *
 * Every test needs its own database, which is the isolation this suite relies on: there is no
 * cleanup anywhere because nothing is ever shared. But migrating per test scales with
 * migration count, and at six migrations it crossed vitest's 5s default and took every db
 * test red at once.
 *
 * Two things had to change. Cloning a dump instead of re-migrating removed almost all of the
 * cost. Building that dump in globalSetup removed the rest, because vitest isolates modules
 * per FILE, so a module-level cache still made the first test in each file pay for it, inside
 * that test's own timer.
 *
 * The inline fallback matters: it keeps a single-file run working without globalSetup.
 */
// Keyed by process so two concurrent runs cannot fight over one file. globalSetup and the
// tests share a process tree, so they agree on it.
export const TEMPLATE_PATH = join(
  tmpdir(),
  `delulu-pglite-template-${process.env.DELULU_TEMPLATE_KEY ?? "default"}.tar.gz`,
);

export async function buildTemplate(): Promise<void> {
  const client = new PGlite();
  // migrate() wants the concrete PgliteDatabase, so cast only on the way out.
  const pg = drizzle(client, { schema });
  await migrate(pg, { migrationsFolder: "drizzle" });
  const dump = await client.dumpDataDir();
  await writeFile(TEMPLATE_PATH, Buffer.from(await dump.arrayBuffer()));
  await client.close();
}

let template: Promise<Blob> | null = null;

async function loadTemplate(): Promise<Blob> {
  try {
    return new Blob([await readFile(TEMPLATE_PATH)]);
  } catch {
    // No globalSetup ran, so migrate inline this once.
    const client = new PGlite();
    const pg = drizzle(client, { schema });
    await migrate(pg, { migrationsFolder: "drizzle" });
    const dump = await client.dumpDataDir();
    await client.close();
    return dump;
  }
}

/** Migrated and empty, for the tests that need the before-the-first-tap state. */
export async function createMigratedDb(): Promise<Db> {
  template ??= loadTemplate();
  const client = await PGlite.create({ loadDataDir: await template });
  return drizzle(client, { schema }) as unknown as Db;
}

type NewMember = typeof schema.members.$inferInsert;

/** For tests that start from createMigratedDb: startSeason refuses an empty members table. */
export async function seedMembers(db: Db, members: readonly NewMember[] = TEST_MEMBERS) {
  await db.insert(schema.members).values([...members]);
}

export async function createTestDb(members: readonly NewMember[] = TEST_MEMBERS): Promise<Db> {
  const db = await createMigratedDb();
  await seedMembers(db, members);
  await startSeason(db, TEST_DAY_ONE);
  return db;
}
