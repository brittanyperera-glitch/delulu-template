import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { currentManifesto, hasEditedToday, listVersions, saveVersion } from "@/lib/manifesto";

describe("manifesto versions", () => {
  it("seeds version one and keeps every save as a version", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    expect(await listVersions(db, season.id)).toHaveLength(1);
    const v2 = await saveVersion(db, {
      seasonId: season.id,
      author: "sam",
      day: 4,
      body: "I am so back. And so is he.",
    });
    expect(v2?.day).toBe(4);
    expect(await currentManifesto(db, season.id)).toBe("I am so back. And so is he.");
    const versions = await listVersions(db, season.id);
    expect(versions).toHaveLength(2);
    expect(versions[0].author).toBe("sam");
  });

  it("writes nothing when the body has not changed", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const body = await currentManifesto(db, season.id);
    expect(await saveVersion(db, { seasonId: season.id, author: "alex", day: 2, body })).toBeNull();
    expect(await listVersions(db, season.id)).toHaveLength(1);
  });

  it("refuses an empty or over-long body", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await expect(
      saveVersion(db, { seasonId: season.id, author: "alex", day: 2, body: "  " }),
    ).rejects.toThrow(/Manifesto/);
    await expect(
      saveVersion(db, { seasonId: season.id, author: "alex", day: 2, body: "x".repeat(4001) }),
    ).rejects.toThrow(/Manifesto/);
  });
});

describe("one edit per person per day", () => {
  it("refuses a second edit by the same person on the same day", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await saveVersion(db, {
      seasonId: season.id,
      author: "alex",
      day: 5,
      body: "First real change.",
    });
    await expect(
      saveVersion(db, {
        seasonId: season.id,
        author: "alex",
        day: 5,
        body: "Second change same day.",
      }),
    ).rejects.toThrow(/edit/i);
  });

  it("still allows the other person on the same day", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await saveVersion(db, { seasonId: season.id, author: "alex", day: 5, body: "Alex's turn." });
    const v = await saveVersion(db, {
      seasonId: season.id,
      author: "sam",
      day: 5,
      body: "Sam's turn.",
    });
    expect(v?.author).toBe("sam");
  });

  it("allows the same person again on the next day", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await saveVersion(db, { seasonId: season.id, author: "alex", day: 5, body: "Day five." });
    const v = await saveVersion(db, {
      seasonId: season.id,
      author: "alex",
      day: 6,
      body: "Day six.",
    });
    expect(v?.day).toBe(6);
  });

  it("does not spend the edit on a no-op save", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const body = await currentManifesto(db, season.id);
    expect(await saveVersion(db, { seasonId: season.id, author: "alex", day: 5, body })).toBeNull();
    const v = await saveVersion(db, {
      seasonId: season.id,
      author: "alex",
      day: 5,
      body: "A real change, after the no-op.",
    });
    expect(v?.day).toBe(5);
  });

  it("does not let the pre-loaded version one spend Alex's day-one edit", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const v = await saveVersion(db, {
      seasonId: season.id,
      author: "alex",
      day: 1,
      body: "Alex's real day-one edit.",
    });
    expect(v).not.toBeNull();
    expect(v?.day).toBe(1);
    // and the real edit above does now spend the day, unlike the pre-loaded version one
    await expect(
      saveVersion(db, {
        seasonId: season.id,
        author: "alex",
        day: 1,
        body: "A second day-one edit.",
      }),
    ).rejects.toThrow(/edit/i);
  });

  it("hasEditedToday matches what the guard enforces", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    expect(await hasEditedToday(db, season.id, "alex", 1)).toBe(false);
    await saveVersion(db, { seasonId: season.id, author: "alex", day: 1, body: "Change." });
    expect(await hasEditedToday(db, season.id, "alex", 1)).toBe(true);
    expect(await hasEditedToday(db, season.id, "sam", 1)).toBe(false);
  });
});
