import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { delusions } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addStamp, createPost, listWall } from "@/lib/repo/posts";
import { defaultSkinId, postAndClaim, postFromSection } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";

const DAY7 = new Date("2026-09-08T12:00:00Z");

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  return { db, seasonId: season.id, skinId: skin.id };
}

describe("automatic stamps", () => {
  it("lets a section stamp its own post", async () => {
    const { db, seasonId, skinId } = await setup();
    const post = await postFromSection(
      db,
      { seasonId, author: "alex", skinId, source: "delusion", type: "text", body: "signed it" },
      DAY7,
    );
    expect(post.stamps).toEqual(["TRULULU"]);
    expect(post.source).toBe("delusion");
  });

  it("still refuses a section stamp on a manual post", async () => {
    const { db, seasonId, skinId } = await setup();
    await expect(
      createPost(
        db,
        { seasonId, author: "alex", skinId, type: "text", body: "x", stamps: ["TRULULU"] },
        DAY7,
      ),
    ).rejects.toThrow(/stamp/);
  });

  it("refuses another section's stamp", async () => {
    const { db, seasonId, skinId } = await setup();
    await expect(
      createPost(
        db,
        {
          seasonId,
          author: "alex",
          skinId,
          type: "text",
          body: "x",
          stamps: ["RECEIPT"],
          source: "jar",
        },
        DAY7,
      ),
    ).rejects.toThrow(/stamp/);
  });

  it("adds a stamp to a post that already exists, once", async () => {
    const { db, seasonId, skinId } = await setup();
    const post = await createPost(
      db,
      { seasonId, author: "alex", skinId, type: "text", body: "it happened" },
      DAY7,
    );
    await addStamp(db, post.id, "TRULULU");
    await addStamp(db, post.id, "TRULULU");
    const [item] = await listWall(db, seasonId, { stamp: "TRULULU" });
    expect(item.post.stamps).toEqual(["TRULULU"]);
    await expect(addStamp(db, post.id, "NOPE")).rejects.toThrow(/stamp/);
  });
});

describe("postAndClaim", () => {
  it("keeps the post when the claim lands and discards it when it does not", async () => {
    const { db, seasonId, skinId } = await setup();
    const [d] = await db
      .insert(delusions)
      .values({ seasonId, about: "alex", addedBy: "alex", body: "sells out a room" })
      .returning();
    const claim = (postId: number) =>
      db
        .update(delusions)
        .set({ trululuPostId: postId, trululuDay: 7 })
        .where(and(eq(delusions.id, d.id), isNull(delusions.trululuPostId)))
        .returning({ id: delusions.id });
    const first = await postAndClaim(
      db,
      { seasonId, author: "alex", skinId, source: "delusion", type: "text", body: "sold out" },
      claim,
      DAY7,
    );
    expect(first).not.toBeNull();
    const second = await postAndClaim(
      db,
      {
        seasonId,
        author: "alex",
        skinId,
        source: "delusion",
        type: "text",
        body: "sold out again",
      },
      claim,
      DAY7,
    );
    expect(second).toBeNull();
    expect((await listWall(db, seasonId)).length).toBe(1);
  });
});

describe("defaultSkinId", () => {
  it("prefers the last posted skin, then the newest, and is null with no skins", async () => {
    const { db, seasonId } = await setup();
    expect(await defaultSkinId(db, seasonId, "sam")).toBeNull();
    const older = await createSkin(db, { seasonId, owner: "sam", name: "Marathon" });
    const newer = await createSkin(db, { seasonId, owner: "sam", name: "Michelin" });
    expect(await defaultSkinId(db, seasonId, "sam")).toBe(newer.id);
    await createPost(
      db,
      { seasonId, author: "sam", skinId: older.id, type: "text", body: "ran" },
      DAY7,
    );
    expect(await defaultSkinId(db, seasonId, "sam")).toBe(older.id);
    await createPost(
      db,
      { seasonId, author: "sam", skinId: newer.id, type: "text", body: "ate" },
      DAY7,
    );
    expect(await defaultSkinId(db, seasonId, "sam")).toBe(newer.id);
  });

  it("ignores the other player's posts", async () => {
    const { db, seasonId, skinId } = await setup();
    await createPost(db, { seasonId, author: "alex", skinId, type: "text", body: "mine" }, DAY7);
    expect(await defaultSkinId(db, seasonId, "sam")).toBeNull();
  });
});
