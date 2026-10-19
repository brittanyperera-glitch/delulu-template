import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createPost, deletePost } from "@/lib/repo/posts";
import { createSkin, skinUseCounts } from "@/lib/repo/skins";

const DAY1 = new Date("2026-09-02T12:00:00Z");

describe("skinUseCounts", () => {
  it("counts the posts carrying each skin, in one query", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const a = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    const b = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
    await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "one" },
      DAY1,
    );
    await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "two" },
      DAY1,
    );
    await createPost(
      db,
      { seasonId: season.id, author: "sam", skinId: b.id, type: "text", body: "three" },
      DAY1,
    );
    const counts = await skinUseCounts(db, season.id);
    expect(counts.get(a.id)).toBe(2);
    expect(counts.get(b.id)).toBe(1);
    expect(counts.has(999)).toBe(false);
  });

  it("leaves out a deleted post and an unused skin", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const a = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    const unused = await createSkin(db, { seasonId: season.id, owner: "alex", name: "Gardener" });
    const kept = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "kept" },
      DAY1,
    );
    const gone = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: a.id, type: "text", body: "gone" },
      DAY1,
    );
    await deletePost(db, gone.id, "alex");
    const counts = await skinUseCounts(db, season.id);
    expect(counts.get(a.id)).toBe(1);
    expect(counts.has(unused.id)).toBe(false);
    expect(kept.skinId).toBe(a.id);
  });
});
