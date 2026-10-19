import { describe, expect, it } from "vitest";
import { dayNumber, localDate } from "@/lib/days";
import { manifestoVersions, seasons } from "@/lib/db/schema";
import { createMigratedDb, seedMembers, TEST_DAY_ONE } from "@/lib/db/test-db";
import { MANIFESTO_V1 } from "@/lib/manifesto";
import { activeSeason, currentSeason, startSeason } from "@/lib/repo/seasons";

describe("starting the season", () => {
  it("has no season before the first tap", async () => {
    const db = await createMigratedDb();
    expect(await activeSeason(db)).toBeUndefined();
    await expect(currentSeason(db)).rejects.toThrow(/start Day 1/);
  });

  it("starts on the date given, with the manifesto as version 1", async () => {
    const db = await createMigratedDb();
    await seedMembers(db);
    const season = await startSeason(db, TEST_DAY_ONE);
    expect(season.number).toBe(1);
    expect(season.dayOne).toBe(TEST_DAY_ONE);
    const versions = await db.select().from(manifestoVersions);
    expect(versions).toHaveLength(1);
    expect(versions[0].seasonId).toBe(season.id);
    expect(versions[0].day).toBe(1);
    expect(versions[0].body).toBe(MANIFESTO_V1);
  });

  it("a tap today is Day 1, not Day 0", async () => {
    const db = await createMigratedDb();
    await seedMembers(db);
    const now = new Date();
    const season = await startSeason(db, localDate(now, "UTC"));
    expect(dayNumber(now, season.dayOne, season.timezone)).toBe(1);
  });

  it("two taps at the same moment yield one season and one manifesto", async () => {
    // PGlite runs one statement at a time, so this exercises the loser reading back the
    // winner's row rather than genuine parallelism. Under real Postgres the unique index
    // on seasons.number is what makes the write exactly-once.
    const db = await createMigratedDb();
    await seedMembers(db);
    const [a, b] = await Promise.all([
      startSeason(db, TEST_DAY_ONE),
      startSeason(db, TEST_DAY_ONE),
    ]);
    expect(a.id).toBe(b.id);
    expect(await db.select().from(seasons)).toHaveLength(1);
    expect(await db.select().from(manifestoVersions)).toHaveLength(1);
  });

  it("a later tap cannot move day one", async () => {
    const db = await createMigratedDb();
    await seedMembers(db);
    const first = await startSeason(db, TEST_DAY_ONE);
    const again = await startSeason(db, "2026-10-01");
    expect(again.id).toBe(first.id);
    expect(again.dayOne).toBe(TEST_DAY_ONE);
    expect(await db.select().from(manifestoVersions)).toHaveLength(1);
  });

  it("rejects a second season number 1 written straight to the table", async () => {
    const db = await createMigratedDb();
    await seedMembers(db);
    await startSeason(db, TEST_DAY_ONE);
    await expect(db.insert(seasons).values({ number: 1, dayOne: "2026-10-01" })).rejects.toThrow();
  });
});
