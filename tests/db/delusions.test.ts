import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addDelusion, claimTrululu, listDelusions, trululuLines } from "@/lib/repo/delusions";
import { createPost, listWall } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";

const DAY7 = new Date("2026-09-08T12:00:00Z");

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  return { db, seasonId: season.id, skinId: skin.id };
}

describe("delusions", () => {
  it("keeps one shared list, either player writing about either player", async () => {
    const { db, seasonId } = await setup();
    await addDelusion(db, {
      seasonId,
      about: "alex",
      addedBy: "sam",
      body: "signs a record deal",
    });
    await addDelusion(db, { seasonId, about: "sam", addedBy: "sam", body: "runs a sub three" });
    const all = await listDelusions(db, seasonId);
    expect(all.map((d) => `${d.about}:${d.addedBy}`)).toEqual(["alex:sam", "sam:sam"]);
  });

  it("takes an optional skin and leaves it null when none is given", async () => {
    const { db, seasonId, skinId } = await setup();
    const tagged = await addDelusion(db, {
      seasonId,
      about: "alex",
      addedBy: "alex",
      body: "runs a marathon",
      skinId,
    });
    expect(tagged.skinId).toBe(skinId);
    const bare = await addDelusion(db, {
      seasonId,
      about: "alex",
      addedBy: "sam",
      body: "learns to weld",
    });
    expect(bare.skinId).toBeNull();
  });

  it("flips once, links the post, and hands the line to the wall view", async () => {
    const { db, seasonId, skinId } = await setup();
    const [d] = [
      await addDelusion(db, { seasonId, about: "alex", addedBy: "alex", body: "plays a gig" }),
    ];
    const post = await postAndClaim(
      db,
      {
        seasonId,
        author: "alex",
        skinId,
        source: "delusion",
        type: "text",
        body: "played the gig",
      },
      (postId) => claimTrululu(db, d.id, postId, 7),
      DAY7,
    );
    expect(post).not.toBeNull();
    const [flipped] = await listDelusions(db, seasonId);
    expect(flipped.trululuPostId).toBe(post?.id);
    expect(flipped.trululuDay).toBe(7);
    const [item] = await listWall(db, seasonId, { stamp: "TRULULU" });
    expect(item.post.stamps).toEqual(["TRULULU"]);
    expect((await trululuLines(db, seasonId)).get(item.post.id)).toBe("plays a gig");
    const second = await postAndClaim(
      db,
      { seasonId, author: "alex", skinId, source: "delusion", type: "text", body: "again" },
      (postId) => claimTrululu(db, d.id, postId, 8),
      DAY7,
    );
    expect(second).toBeNull();
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("can flip onto a post that already exists", async () => {
    const { db, seasonId, skinId } = await setup();
    const d = await addDelusion(db, {
      seasonId,
      about: "sam",
      addedBy: "alex",
      body: "opens a restaurant",
    });
    const post = await createPost(
      db,
      { seasonId, author: "alex", skinId, type: "text", body: "table for two" },
      DAY7,
    );
    expect(await claimTrululu(db, d.id, post.id, 7)).toHaveLength(1);
  });

  it("refuses an empty or over-long delusion", async () => {
    const { db, seasonId } = await setup();
    await expect(
      addDelusion(db, { seasonId, about: "alex", addedBy: "alex", body: " " }),
    ).rejects.toThrow(/delusion/i);
    await expect(
      addDelusion(db, { seasonId, about: "alex", addedBy: "alex", body: "x".repeat(121) }),
    ).rejects.toThrow(/delusion/i);
  });
});
