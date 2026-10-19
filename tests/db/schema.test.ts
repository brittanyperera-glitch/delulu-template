import { describe, expect, it } from "vitest";
import { comments, manifestoVersions, posts, reactions, skins } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { MANIFESTO_V1 } from "@/lib/manifesto";

describe("schema", () => {
  it("migrates, and the test harness starts a season", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    expect(season.number).toBe(1);
    expect(season.dayOne).toBe("2026-09-02");
  });

  it("a post cannot exist without a skin", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await expect(
      db.insert(posts).values({
        seasonId: season.id,
        author: "alex",
        day: 1,
        type: "text",
        body: "hi",
      } as never),
    ).rejects.toThrow();
  });

  it("stores every post type and defaults stamps to empty", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const [skin] = await db
      .insert(skins)
      .values({ seasonId: season.id, owner: "alex", name: "CEO Alex" })
      .returning();
    const [post] = await db
      .insert(posts)
      .values({
        seasonId: season.id,
        author: "alex",
        day: 1,
        skinId: skin.id,
        type: "text",
        body: "so back",
      })
      .returning();
    expect(post.stamps).toEqual([]);
    expect(post.source).toBe("manual");
  });

  it("one reaction word per player per post", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const [skin] = await db
      .insert(skins)
      .values({ seasonId: season.id, owner: "sam", name: "Marathon" })
      .returning();
    const [post] = await db
      .insert(posts)
      .values({
        seasonId: season.id,
        author: "sam",
        day: 1,
        skinId: skin.id,
        type: "text",
        body: "x",
      })
      .returning();
    await db.insert(reactions).values({ postId: post.id, author: "alex", word: "FERAL" });
    await expect(
      db.insert(reactions).values({ postId: post.id, author: "alex", word: "FERAL" }),
    ).rejects.toThrow();
    await db
      .insert(comments)
      .values({ postId: post.id, author: "alex", body: "absolutely unhinged" });
    const [v] = await db.select().from(manifestoVersions);
    expect(v.day).toBe(1);
    expect(v.body).toBe(MANIFESTO_V1);
  });
});
