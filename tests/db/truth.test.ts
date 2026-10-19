import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { answer, answeredDays, answersFor, questionFor, revealed } from "@/lib/repo/truth";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

const PAIR = ["alex", "sam"];

describe("truth or truth", () => {
  it("takes one question per day from the bank", () => {
    // Day 1 of the bank, rewritten on 2026-09-02.
    expect(questionFor(1)).toBe("villain origin story. go.");
    // Plan text said "Season Two: yes or yes?"; the real bank (src/lib/content/truth-or-truth.ts,
    // generated from docs/content) has "season two. yes or yes" at index 99. Matched to the source.
    expect(questionFor(100)).toBe("season two. yes or yes");
    expect(questionFor(0)).toBeNull();
    expect(questionFor(101)).toBeNull();
  });

  it("hides an answer until both are in", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: 4, author: "alex", body: "the marathon" }, PAIR, 4);
    expect(revealed(await answersFor(db, seasonId, 4), PAIR, 4, 4)).toBe(false);
    await answer(db, { seasonId, day: 4, author: "sam", body: "the restaurant" }, PAIR, 4);
    expect(revealed(await answersFor(db, seasonId, 4), PAIR, 4, 4)).toBe(true);
  });

  it("lets you change your answer until both are in, then fixes it", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: 4, author: "alex", body: "first go" }, PAIR, 4);
    await answer(db, { seasonId, day: 4, author: "alex", body: "second go" }, PAIR, 4);
    expect((await answersFor(db, seasonId, 4))[0].body).toBe("second go");
    await answer(db, { seasonId, day: 4, author: "sam", body: "mine" }, PAIR, 4);
    await expect(
      answer(db, { seasonId, day: 4, author: "alex", body: "third go" }, PAIR, 4),
    ).rejects.toThrow(/already in/i);
  });

  it("keeps an earlier day open and lists the answered days newest first", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: 2, author: "alex", body: "a" }, PAIR, 2);
    await answer(db, { seasonId, day: 2, author: "sam", body: "b" }, PAIR, 2);
    await answer(db, { seasonId, day: 5, author: "alex", body: "c" }, PAIR, 5);
    await answer(db, { seasonId, day: 5, author: "sam", body: "d" }, PAIR, 5);
    expect(await answeredDays(db, seasonId, PAIR, 5)).toEqual([5, 2]);
  });

  it("refuses an empty or over-long answer", async () => {
    const { db, seasonId } = await setup();
    await expect(
      answer(db, { seasonId, day: 3, author: "alex", body: "   " }, PAIR, 3),
    ).rejects.toThrow(/answer/i);
    await expect(
      answer(db, { seasonId, day: 3, author: "alex", body: "x".repeat(501) }, PAIR, 3),
    ).rejects.toThrow(/answer/i);
  });
});
