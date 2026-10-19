import { describe, expect, it } from "vitest";
import { checkpoints } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { applyRollover } from "@/lib/rollover";

const on = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

describe("applyRollover", () => {
  it("does nothing before Day 1", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const out = await applyRollover(db, season, on("2026-09-01"));
    expect(out.day).toBe(0);
    expect(out.question).toBeNull();
  });

  it("flags each checkpoint day once, including days nobody visited", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const first = await applyRollover(db, season, on("2026-10-01"));
    expect(first.day).toBe(30);
    expect(first.flagged).toEqual([10, 25]);
    const second = await applyRollover(db, season, on("2026-10-01"));
    expect(second.flagged).toEqual([]);
    expect(await db.select().from(checkpoints)).toHaveLength(2);
  });

  it("reads the day in the season's own zone", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    // 13:00 UTC on 2 Sep is 01:00 on 3 Sep in Auckland, still 2 Sep in Berlin
    const now = new Date("2026-09-02T13:00:00Z");
    const out = await applyRollover(db, { ...season, timezone: "Pacific/Auckland" }, now);
    expect(out.day).toBe(2);
  });

  it("hands back the day's question and stores nothing for it", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const out = await applyRollover(db, season, on("2026-09-02"));
    expect(out.day).toBe(1);
    expect(out.question).toBe("villain origin story. go.");
  });
});
