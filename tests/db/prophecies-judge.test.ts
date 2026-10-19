import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addProphecy, judge, listAll, tally } from "@/lib/repo/prophecies";

async function written() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const p = await addProphecy(
    db,
    { seasonId: season.id, author: "alex", about: "sam", body: "has run a marathon" },
    2,
  );
  return { db, seasonId: season.id, p };
}

describe("judging", () => {
  it("only the person it is about may judge, and only from Day 100", async () => {
    const { db, p } = await written();
    await expect(
      judge(db, { id: p.id, by: "alex", verdict: "fulfilled", day: 100 }),
    ).rejects.toThrow(/about/i);
    await expect(judge(db, { id: p.id, by: "sam", verdict: "fulfilled", day: 99 })).rejects.toThrow(
      /Day 100/,
    );
    await judge(db, { id: p.id, by: "sam", verdict: "fulfilled", day: 100 });
    expect((await listAll(db, p.seasonId))[0].verdict).toBe("fulfilled");
    await judge(db, { id: p.id, by: "sam", verdict: "delulu", day: 100 });
    expect((await listAll(db, p.seasonId))[0].verdict).toBe("delulu");
  });

  it("tallies the two verdicts", async () => {
    const { db, seasonId, p } = await written();
    await addProphecy(db, { seasonId, author: "sam", about: "alex", body: "has a record deal" }, 2);
    await judge(db, { id: p.id, by: "sam", verdict: "fulfilled", day: 100 });
    expect(tally(await listAll(db, seasonId))).toEqual({ fulfilled: 1, delulu: 0 });
  });
});
