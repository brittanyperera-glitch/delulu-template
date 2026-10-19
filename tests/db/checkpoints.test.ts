import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { buildRecap, periodFor } from "@/lib/repo/checkpoints";
import { createPost, deletePost } from "@/lib/repo/posts";
import { toggleReaction } from "@/lib/repo/reactions";
import { createSkin } from "@/lib/repo/skins";

const on = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

describe("periodFor", () => {
  it("covers Day 1 for the first Checkpoint and the gap since the last one after that", () => {
    expect(periodFor(10)).toEqual({ from: 1, to: 10 });
    expect(periodFor(25)).toEqual({ from: 11, to: 25 });
    expect(periodFor(100)).toEqual({ from: 76, to: 100 });
  });

  it("refuses a day that is not a Checkpoint", () => {
    expect(() => periodFor(11)).toThrow(/Checkpoint/);
  });
});

describe("buildRecap", () => {
  it("counts posts, stamps and skins used inside the period only, and finds the most reacted post", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    // A second skin used only outside the window: skinsUsed must not count it.
    const outsideSkin = await createSkin(db, {
      seasonId: season.id,
      owner: "alex",
      name: "Gardener",
    });
    const inside = await createPost(
      db,
      {
        seasonId: season.id,
        author: "alex",
        skinId: skin.id,
        type: "text",
        body: "signed a record deal",
        stamps: ["L"],
      },
      on("2026-09-04"),
    );
    await createPost(
      db,
      {
        seasonId: season.id,
        author: "alex",
        skinId: skin.id,
        type: "text",
        body: "a normal day",
        stamps: ["W"],
      },
      on("2026-09-05"),
    );
    await createPost(
      db,
      {
        seasonId: season.id,
        author: "alex",
        skinId: outsideSkin.id,
        type: "text",
        body: "outside the window",
        stamps: ["L"],
      },
      on("2026-09-12"),
    );
    // "ICONIC" and "FERAL" are not real reactions; STRINGS.reactions is the fixed six words.
    await toggleReaction(db, inside.id, "sam", "wicked");
    await toggleReaction(db, inside.id, "alex", "big time");
    const recap = await buildRecap(db, season.id, 1, 10);
    expect(recap).toEqual({
      from: 1,
      to: 10,
      posts: 2,
      trululus: 0,
      ws: 1,
      ls: 1,
      skinsUsed: 1,
      topPostId: inside.id,
    });
  });

  it("counts two skins when the stretch carries both, and leaves out a deleted post", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const a = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    const b = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
    await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "hers" },
      on("2026-09-04"),
    );
    await createPost(
      db,
      { seasonId: season.id, author: "sam", skinId: b.id, type: "text", body: "his" },
      on("2026-09-05"),
    );
    const gone = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "gone" },
      on("2026-09-06"),
    );
    await deletePost(db, gone.id, "alex");
    const recap = await buildRecap(db, season.id, 1, 10);
    expect(recap.skinsUsed).toBe(2);
    expect(recap.posts).toBe(2);
  });

  it("counts a Trululu the same way as any other stamp and finds no top post when nobody has reacted", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const skin = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
    await createPost(
      db,
      {
        seasonId: season.id,
        author: "sam",
        skinId: skin.id,
        type: "text",
        body: "sold out a show",
        source: "delusion",
        stamps: ["TRULULU"],
      },
      on("2026-09-06"),
    );
    const recap = await buildRecap(db, season.id, 1, 10);
    expect(recap.trululus).toBe(1);
    expect(recap.topPostId).toBeNull();
  });

  it("returns zeroes for a stretch with nothing in it", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const recap = await buildRecap(db, season.id, 11, 25);
    expect(recap).toEqual({
      from: 11,
      to: 25,
      posts: 0,
      trululus: 0,
      ws: 0,
      ls: 0,
      skinsUsed: 0,
      topPostId: null,
    });
  });
});
