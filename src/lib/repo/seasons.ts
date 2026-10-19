import { asc, eq, isNull, notExists } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { manifestoVersions, members, seasons } from "@/lib/db/schema";
import { MANIFESTO_V1 } from "@/lib/manifesto";
import { insertMembers, type NewMember, removeMembers } from "@/lib/repo/members";

type Season = typeof seasons.$inferSelect;

export async function activeSeason(db: Db): Promise<Season | undefined> {
  const [season] = await db.select().from(seasons).where(isNull(seasons.archivedAt)).limit(1);
  return season;
}

export async function currentSeason(db: Db): Promise<Season> {
  const season = await activeSeason(db);
  if (!season) throw new Error("No active season. Open the app and start Day 1.");
  return season;
}

export async function seasonById(db: Db, id: number) {
  const [season] = await db.select().from(seasons).where(eq(seasons.id, id)).limit(1);
  return season;
}

/**
 * Exactly-once, because both of them can tap Start in the same second. The unique index on
 * seasons.number arbitrates: one insert returns a row, the loser returns nothing and reads
 * the winner's back, so only the winner writes the manifesto and there is never a second
 * version 1. Day one is therefore locked by whoever tapped first.
 *
 * Season Two limit: if season 1 were archived this still conflicts and returns the archived
 * row, while activeSeason finds none. A second season needs its own number.
 */
export async function startSeason(db: Db, dayOne: string, timezone = "UTC"): Promise<Season> {
  const [created] = await db
    .insert(seasons)
    .values({ number: 1, dayOne, timezone })
    .onConflictDoNothing({ target: seasons.number })
    .returning();
  if (!created) {
    const [existing] = await db.select().from(seasons).where(eq(seasons.number, 1)).limit(1);
    return existing;
  }
  // Version 1 is the template's text, credited to the first member in sort order.
  const [first] = await db
    .select({ slug: members.slug })
    .from(members)
    .orderBy(asc(members.sortOrder))
    .limit(1);
  if (!first) throw new Error("Add members before starting a season");
  await db
    .insert(manifestoVersions)
    .values({ seasonId: created.id, body: MANIFESTO_V1, author: first.slug, day: 1 });
  return created;
}

export class SetupRefused extends Error {}

export type GroupSetup = { members: readonly NewMember[]; dayOne: string; timezone: string };

/** A season with nobody in it is a half-built setup, not a finished one. */
export async function isSetUp(db: Db): Promise<boolean> {
  if (!(await activeSeason(db))) return false;
  const [member] = await db.select({ slug: members.slug }).from(members).limit(1);
  return member !== undefined;
}

/**
 * First-run setup: the members, then the season. `atomic` is false for the Neon HTTP driver,
 * which has no transactions; there a failed season start removes the season and members just
 * added, so the setup page is usable again either way. A season with no members (a crash, or
 * two first-run submissions at once) is cleared and set up again; members with no season are
 * cleared too. Safe because without members nothing can reference a season's content.
 */
export async function setUpGroup(db: Db, input: GroupSetup, atomic: boolean): Promise<Season> {
  const seasonRows = await db.select({ id: seasons.id }).from(seasons);
  if (seasonRows.length > 0) {
    const [member] = await db.select({ slug: members.slug }).from(members).limit(1);
    if (member) throw new SetupRefused("Already set up");
    await db.delete(seasons);
  }
  const write = async (d: Db) => {
    await insertMembers(d, input.members);
    return startSeason(d, input.dayOne, input.timezone);
  };
  if (atomic) return db.transaction((tx) => write(tx as unknown as Db));
  if (seasonRows.length === 0) await db.delete(members);
  let membersIn = false;
  try {
    await insertMembers(db, input.members);
    membersIn = true;
    return await startSeason(db, input.dayOne, input.timezone);
  } catch (e) {
    if (membersIn) {
      await db
        .delete(seasons)
        .where(
          notExists(
            db
              .select({ id: manifestoVersions.id })
              .from(manifestoVersions)
              .where(eq(manifestoVersions.seasonId, seasons.id)),
          ),
        );
    }
    await removeMembers(
      db,
      input.members.map((m) => m.slug),
    );
    throw e;
  }
}
