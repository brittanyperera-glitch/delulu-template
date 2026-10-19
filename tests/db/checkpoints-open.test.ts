import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { checkpoints, jarItems } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { checkpointViews, openCheckpoint } from "@/lib/repo/checkpoints";
import { addJarItem, countsBySize } from "@/lib/repo/jar";
import { listWall } from "@/lib/repo/posts";
import { createSkin } from "@/lib/repo/skins";

const DAY10 = new Date("2026-09-11T12:00:00Z");
const first = () => 0;

async function flagged(day = 10) {
  const db = await createTestDb();
  const season = await currentSeason(db);
  await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
  const [row] = await db.insert(checkpoints).values({ seasonId: season.id, day }).returning();
  return { db, seasonId: season.id, id: row.id };
}

describe("opening a Checkpoint", () => {
  it("computes the recap, draws Feral, and posts once with CHECKPOINT", async () => {
    const { db, seasonId, id } = await flagged();
    await addJarItem(db, { seasonId, author: "alex", body: "cold plunge", size: "feral" });
    const opened = await openCheckpoint(db, seasonId, id, "alex", DAY10, first);
    expect(opened.postId).not.toBeNull();
    expect(opened.jarItemId).not.toBeNull();
    expect(opened.recapJson?.to).toBe(10);
    const [item] = await listWall(db, seasonId);
    expect(item.post.stamps).toEqual(["CHECKPOINT"]);
    expect(item.post.body).toContain("cold plunge");
    expect((await countsBySize(db, seasonId)).feral).toBe(0);
  });

  it("still posts when the Feral tier is empty, and says so", async () => {
    const { db, seasonId, id } = await flagged();
    const opened = await openCheckpoint(db, seasonId, id, "alex", DAY10, first);
    expect(opened.jarItemId).toBeNull();
    const [item] = await listWall(db, seasonId);
    // posts.body is nullable at the column level; this post is always text, never null.
    expect(item.post.body?.toLowerCase()).toContain("feral");
  });

  it("opening twice does not draw twice or post twice", async () => {
    const { db, seasonId, id } = await flagged();
    await addJarItem(db, { seasonId, author: "alex", body: "cold plunge", size: "feral" });
    await addJarItem(db, { seasonId, author: "sam", body: "sauna then snow", size: "feral" });
    const first1 = await openCheckpoint(db, seasonId, id, "alex", DAY10, first);
    const second = await openCheckpoint(db, seasonId, id, "sam", DAY10, first);
    expect(second.id).toBe(first1.id);
    expect(second.postId).toBe(first1.postId);
    expect(await listWall(db, seasonId)).toHaveLength(1);
    expect((await countsBySize(db, seasonId)).feral).toBe(1);
  });

  it("the loser of a race puts its drawn slip back", async () => {
    const { db, seasonId, id } = await flagged();
    await addJarItem(db, { seasonId, author: "alex", body: "cold plunge", size: "feral" });
    await addJarItem(db, { seasonId, author: "sam", body: "sauna then snow", size: "feral" });
    await Promise.all([
      openCheckpoint(db, seasonId, id, "alex", DAY10, first),
      openCheckpoint(db, seasonId, id, "sam", DAY10, first),
    ]);
    expect(await listWall(db, seasonId)).toHaveLength(1);
    expect((await countsBySize(db, seasonId)).feral).toBe(1);
    const rows = await db
      .select()
      .from(jarItems)
      .where(and(eq(jarItems.seasonId, seasonId), eq(jarItems.size, "feral")));
    expect(rows.filter((r) => r.drawnAt !== null)).toHaveLength(1);
  });

  it("lists Checkpoints day ascending with their Feral quest, pending or opened", async () => {
    const { db, seasonId, id } = await flagged();
    await addJarItem(db, { seasonId, author: "alex", body: "cold plunge", size: "feral" });
    await openCheckpoint(db, seasonId, id, "alex", DAY10, first);
    await db.insert(checkpoints).values({ seasonId, day: 25 });
    const views = await checkpointViews(db, seasonId);
    expect(views.map((v) => v.checkpoint.day)).toEqual([10, 25]);
    expect(views[0].feral?.body).toBe("cold plunge");
    expect(views[1].feral).toBeNull();
    expect(views[1].checkpoint.postId).toBeNull();
  });
});
