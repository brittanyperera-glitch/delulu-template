import { buildTemplate } from "@/lib/db/test-db";

/**
 * Runs once for the whole run, before any test's timer starts. Its only job is to migrate a
 * throwaway PGlite instance and dump it, so every test can clone that dump instead of
 * running six migrations of its own.
 */
export default async function setup(): Promise<void> {
  await buildTemplate();
}
