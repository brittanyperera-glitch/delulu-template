import { describe, expect, it } from "vitest";
import {
  bets,
  bombs,
  checkpoints,
  dares,
  delusions,
  jarItems,
  prophecies,
  skins,
  spoilers,
  tracks,
  truthAnswers,
} from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";

async function seeded() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

describe("section tables", () => {
  it("holds a delusion, a spoiler and a track", async () => {
    const { db, seasonId } = await seeded();
    const [d] = await db
      .insert(delusions)
      .values({ seasonId, about: "alex", addedBy: "sam", body: "signs a record deal" })
      .returning();
    expect(d.trululuPostId).toBeNull();
    // The skin is optional on both shared lists: an untagged entry is fine.
    expect(d.skinId).toBeNull();
    const [s] = await db
      .insert(spoilers)
      .values({ seasonId, imageUrl: "https://b/x.jpg" })
      .returning();
    expect(s.happenedDay).toBeNull();
    expect(s.skinId).toBeNull();
    const [t] = await db
      .insert(tracks)
      .values({
        seasonId,
        author: "sam",
        url: "https://open.spotify.com/track/a",
        title: "Track",
      })
      .returning();
    expect(t.artist).toBeNull();
  });

  it("tags a delusion and a spoiler with a skin", async () => {
    const { db, seasonId } = await seeded();
    const [skin] = await db
      .insert(skins)
      .values({ seasonId, owner: "sam", name: "Marathon Sam" })
      .returning();
    const [d] = await db
      .insert(delusions)
      .values({
        seasonId,
        about: "sam",
        addedBy: "alex",
        body: "runs a marathon",
        skinId: skin.id,
      })
      .returning();
    expect(d.skinId).toBe(skin.id);
    const [s] = await db
      .insert(spoilers)
      .values({ seasonId, imageUrl: "https://b/y.jpg", skinId: skin.id })
      .returning();
    expect(s.skinId).toBe(skin.id);
  });

  it("defaults a jar item to undrawn with no put backs", async () => {
    const { db, seasonId } = await seeded();
    const [j] = await db
      .insert(jarItems)
      .values({ seasonId, author: "alex", body: "cold plunge", size: "feral" })
      .returning();
    expect(j.putBackCount).toBe(0);
    expect(j.drawnAt).toBeNull();
    expect(j.donePostId).toBeNull();
  });

  it("defaults a dare to open and a bet to proposed", async () => {
    const { db, seasonId } = await seeded();
    const [d] = await db
      .insert(dares)
      .values({ seasonId, darer: "alex", dared: "sam", body: "sing in the street" })
      .returning();
    expect(d.status).toBe("open");
    expect(d.counter).toBeNull();
    const [b] = await db
      .insert(bets)
      .values({
        seasonId,
        proposer: "sam",
        opponent: "alex",
        claim: "she runs it under four hours",
        stakes: "dinner",
      })
      .returning();
    expect(b.status).toBe("proposed");
    expect(b.loser).toBeNull();
  });

  it("holds a bomb and a prophecy with no verdict", async () => {
    const { db, seasonId } = await seeded();
    const [skin] = await db
      .insert(skins)
      .values({ seasonId, owner: "alex", name: "CEO Alex" })
      .returning();
    const [p] = await db
      .insert(prophecies)
      .values({ seasonId, author: "alex", about: "sam", body: "has run a marathon" })
      .returning();
    expect(p.verdict).toBeNull();
    const [b] = await db
      .insert(bombs)
      .values({
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: skin.id,
        armedDay: 3,
        detonateDay: 9,
      })
      .returning();
    expect(b.postId).toBeNull();
  });

  it("allows one truth answer per player per day", async () => {
    const { db, seasonId } = await seeded();
    await db.insert(truthAnswers).values({ seasonId, day: 4, author: "alex", body: "yes" });
    await db.insert(truthAnswers).values({ seasonId, day: 4, author: "sam", body: "also yes" });
    await expect(
      db.insert(truthAnswers).values({ seasonId, day: 4, author: "alex", body: "again" }),
    ).rejects.toThrow();
  });

  it("allows one checkpoint per day", async () => {
    const { db, seasonId } = await seeded();
    await db.insert(checkpoints).values({ seasonId, day: 10 });
    await expect(db.insert(checkpoints).values({ seasonId, day: 10 })).rejects.toThrow();
    const rows = await db.select().from(checkpoints);
    expect(rows[0].recapJson).toBeNull();
    expect(rows[0].postId).toBeNull();
  });
});
