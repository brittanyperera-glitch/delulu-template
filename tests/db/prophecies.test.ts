import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addProphecy, countAll, listAll, listMine, listSealed } from "@/lib/repo/prophecies";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

describe("prophecies", () => {
  it("takes prophecies about either person up to Day 7", async () => {
    const { db, seasonId } = await setup();
    await addProphecy(
      db,
      { seasonId, author: "alex", about: "sam", body: "has run a marathon" },
      1,
    );
    await addProphecy(db, { seasonId, author: "alex", about: "alex", body: "has played a gig" }, 7);
    await addProphecy(db, { seasonId, author: "sam", about: "alex", body: "has a record deal" }, 7);
    expect(await countAll(db, seasonId)).toBe(3);
    expect((await listMine(db, seasonId, "alex")).map((p) => p.body)).toEqual([
      "has run a marathon",
      "has played a gig",
    ]);
    expect((await listAll(db, seasonId)).map((p) => p.day)).toEqual([1, 7, 7]);
  });

  it("seals on Day 8, so the writing is refused from then on", async () => {
    const { db, seasonId } = await setup();
    await expect(
      addProphecy(db, { seasonId, author: "alex", about: "sam", body: "too late" }, 8),
    ).rejects.toThrow(/sealed/i);
    await expect(
      addProphecy(db, { seasonId, author: "alex", about: "sam", body: "far too late" }, 100),
    ).rejects.toThrow(/sealed/i);
    expect(await countAll(db, seasonId)).toBe(0);
  });

  it("gives the reader the other person's prophecies as sealed scrolls, never the words", async () => {
    const { db, seasonId } = await setup();
    await addProphecy(db, { seasonId, author: "alex", about: "sam", body: "alex wrote this" }, 2);
    await addProphecy(db, { seasonId, author: "sam", about: "alex", body: "sam wrote this" }, 2);
    // alex is the reader: she gets sam's scroll tagged sam, and not her own row here.
    const sealed = await listSealed(db, seasonId, "alex");
    expect(sealed.map((s) => s.author)).toEqual(["sam"]);
    // The body is never selected, so the words cannot reach the reader before Day 100. Guard
    // it both ways: no body field on the row, and the secret string absent from the payload.
    for (const s of sealed) expect(s).not.toHaveProperty("body");
    expect(JSON.stringify(sealed)).not.toContain("sam wrote this");
  });

  it("refuses an empty or over-long prophecy", async () => {
    const { db, seasonId } = await setup();
    await expect(
      addProphecy(db, { seasonId, author: "alex", about: "sam", body: " " }, 2),
    ).rejects.toThrow(/prophecy/i);
    await expect(
      addProphecy(db, { seasonId, author: "alex", about: "sam", body: "x".repeat(201) }, 2),
    ).rejects.toThrow(/prophecy/i);
  });
});
