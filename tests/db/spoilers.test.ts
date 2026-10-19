import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { listWall } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";
import { addSpoiler, claimHappened, listSpoilers } from "@/lib/repo/spoilers";

const DAY7 = new Date("2026-09-08T12:00:00Z");

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  return { db, seasonId: season.id, skinId: skin.id };
}

describe("spoilers", () => {
  it("keeps the image and the optional line, newest first, with no owner", async () => {
    const { db, seasonId } = await setup();
    await addSpoiler(db, { seasonId, imageUrl: "https://b/1.jpg" });
    await addSpoiler(db, { seasonId, imageUrl: "https://b/2.jpg", line: "the kitchen" });
    const list = await listSpoilers(db, seasonId);
    expect(list.map((s) => s.imageUrl)).toEqual(["https://b/2.jpg", "https://b/1.jpg"]);
    expect(list[0].line).toBe("the kitchen");
    expect(list[1].line).toBeNull();
    expect(Object.keys(list[0])).not.toContain("owner");
  });

  it("takes an optional skin and leaves it null when none is given", async () => {
    const { db, seasonId, skinId } = await setup();
    const tagged = await addSpoiler(db, { seasonId, imageUrl: "https://b/3.jpg", skinId });
    expect(tagged.skinId).toBe(skinId);
    const bare = await addSpoiler(db, { seasonId, imageUrl: "https://b/4.jpg" });
    expect(bare.skinId).toBeNull();
  });

  it("flips to Happened once and posts the photo with the stamp", async () => {
    const { db, seasonId, skinId } = await setup();
    const s = await addSpoiler(db, { seasonId, imageUrl: "https://b/1.jpg", line: "the kitchen" });
    const post = await postAndClaim(
      db,
      {
        seasonId,
        author: "alex",
        skinId,
        source: "spoiler",
        type: "photo",
        mediaUrl: s.imageUrl,
        body: s.line ?? undefined,
      },
      (postId) => claimHappened(db, s.id, 7, postId),
      DAY7,
    );
    expect(post?.stamps).toEqual(["HAPPENED"]);
    // The board has no owner, so the post belongs to whoever tapped Happened.
    expect(post?.author).toBe("alex");
    expect((await listSpoilers(db, seasonId))[0].happenedDay).toBe(7);
    expect(await claimHappened(db, s.id, 8, 999)).toHaveLength(0);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("lets the other player flip a tile, under their own skin", async () => {
    const { db, seasonId } = await setup();
    const theirs = await createSkin(db, { seasonId, owner: "sam", name: "Marathon" });
    const s = await addSpoiler(db, { seasonId, imageUrl: "https://b/5.jpg" });
    const post = await postAndClaim(
      db,
      {
        seasonId,
        author: "sam",
        skinId: theirs.id,
        source: "spoiler",
        type: "photo",
        mediaUrl: s.imageUrl,
      },
      (postId) => claimHappened(db, s.id, 7, postId),
      DAY7,
    );
    expect(post?.author).toBe("sam");
  });

  it("requires an image and caps the line", async () => {
    const { db, seasonId } = await setup();
    await expect(addSpoiler(db, { seasonId, imageUrl: " " })).rejects.toThrow(/image/i);
    await expect(
      addSpoiler(db, { seasonId, imageUrl: "https://b/1.jpg", line: "x".repeat(81) }),
    ).rejects.toThrow(/line/i);
  });
});
