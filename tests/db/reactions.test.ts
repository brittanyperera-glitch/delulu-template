import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createPost, getPost } from "@/lib/repo/posts";
import { addComment, toggleReaction } from "@/lib/repo/reactions";
import { createSkin } from "@/lib/repo/skins";

async function post() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  const p = await createPost(db, {
    seasonId: season.id,
    author: "alex",
    skinId: skin.id,
    type: "text",
    body: "x",
  });
  return { db, p };
}

describe("reactions", () => {
  it("toggles on and off and only accepts the six words", async () => {
    const { db, p } = await post();
    expect(await toggleReaction(db, p.id, "sam", "ur delulu")).toBe("added");
    expect(await toggleReaction(db, p.id, "sam", "ur delulu")).toBe("removed");
    await expect(toggleReaction(db, p.id, "sam", "lovely")).rejects.toThrow(/reaction/);
  });
});

describe("comments", () => {
  it("adds one-liners within the limit", async () => {
    const { db, p } = await post();
    await addComment(db, p.id, "sam", "absolutely unhinged, keep going");
    await expect(addComment(db, p.id, "sam", "")).rejects.toThrow(/comment/);
    await expect(addComment(db, p.id, "sam", "x".repeat(281))).rejects.toThrow(/comment/);
    const full = await getPost(db, p.id);
    expect(full?.comments.map((c) => c.body)).toEqual(["absolutely unhinged, keep going"]);
    expect(full?.commentCount).toBe(1);
  });
});
