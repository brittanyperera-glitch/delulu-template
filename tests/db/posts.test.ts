import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createPost, deletePost, editPost, getPost, listWall, setHidden } from "@/lib/repo/posts";
import { addComment } from "@/lib/repo/reactions";
import { createSkin } from "@/lib/repo/skins";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const alex = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  const sam = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
  return { db, season, alex, sam };
}
const DAY7 = new Date("2026-09-08T12:00:00Z");

describe("createPost", () => {
  it("stamps the Berlin day and keeps manual stamps", async () => {
    const { db, season, alex } = await setup();
    const post = await createPost(
      db,
      {
        seasonId: season.id,
        author: "alex",
        skinId: alex.id,
        type: "text",
        body: "so back",
        stamps: ["W", "L"],
      },
      DAY7,
    );
    expect(post.day).toBe(7);
    expect(post.stamps).toEqual(["W", "L"]);
  });
  it("rejects posting under the other person's skin", async () => {
    const { db, season, sam } = await setup();
    await expect(
      createPost(
        db,
        { seasonId: season.id, author: "alex", skinId: sam.id, type: "text", body: "x" },
        DAY7,
      ),
    ).rejects.toThrow(/skin/);
  });
  it("requires the right payload per type", async () => {
    const { db, season, alex } = await setup();
    const base = { seasonId: season.id, author: "alex" as const, skinId: alex.id };
    await expect(createPost(db, { ...base, type: "text", body: "   " }, DAY7)).rejects.toThrow(
      /text/,
    );
    await expect(createPost(db, { ...base, type: "photo" }, DAY7)).rejects.toThrow(/photo/);
    await expect(createPost(db, { ...base, type: "link" }, DAY7)).rejects.toThrow(/link/);
    await expect(
      createPost(
        db,
        { ...base, type: "voice", mediaUrl: "https://b/x.webm", mediaSeconds: 200 },
        DAY7,
      ),
    ).rejects.toThrow(/3 minutes/);
    const ok = await createPost(
      db,
      { ...base, type: "link", linkMeta: { url: "https://x.y", title: "X" } },
      DAY7,
    );
    expect(ok.linkMeta?.title).toBe("X");
  });
  it("rejects unknown stamps", async () => {
    const { db, season, alex } = await setup();
    await expect(
      createPost(
        db,
        {
          seasonId: season.id,
          author: "alex",
          skinId: alex.id,
          type: "text",
          body: "x",
          stamps: ["TRULULU"],
        },
        DAY7,
      ),
    ).rejects.toThrow(/stamp/);
  });
});

describe("listWall, edit, delete", () => {
  it("lists newest first, filters by stamp and skin, hides deleted", async () => {
    const { db, season, alex, sam } = await setup();
    const a = await createPost(
      db,
      {
        seasonId: season.id,
        author: "alex",
        skinId: alex.id,
        type: "text",
        body: "a",
        stamps: ["L"],
      },
      DAY7,
    );
    const b = await createPost(
      db,
      {
        seasonId: season.id,
        author: "sam",
        skinId: sam.id,
        type: "text",
        body: "b",
        stamps: ["W"],
      },
      DAY7,
    );
    const c = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "c" },
      DAY7,
    );
    expect((await listWall(db, season.id)).map((i) => i.post.id)).toEqual([c.id, b.id, a.id]);
    expect((await listWall(db, season.id, { stamp: "L" })).map((i) => i.post.id)).toEqual([a.id]);
    expect((await listWall(db, season.id, { skinId: sam.id })).map((i) => i.post.id)).toEqual([
      b.id,
    ]);
    await deletePost(db, c.id, "alex");
    expect((await listWall(db, season.id)).map((i) => i.post.id)).toEqual([b.id, a.id]);
    expect(
      (await listWall(db, season.id, { limit: 1, before: b.id })).map((i) => i.post.id),
    ).toEqual([a.id]);
  });
  it("carries every comment's body on the wall itself, not only on the post page", async () => {
    const { db, season, alex } = await setup();
    const p = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "hi" },
      DAY7,
    );
    await addComment(db, p.id, "sam", "first");
    await addComment(db, p.id, "alex", "second and latest");
    const [item] = await listWall(db, season.id);
    expect(item.comments.map((c) => c.body)).toEqual(["first", "second and latest"]);
    expect(item.commentCount).toBe(2);
  });

  it("only the author edits or deletes", async () => {
    const { db, season, alex } = await setup();
    const p = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "typo" },
      DAY7,
    );
    await expect(editPost(db, p.id, "sam", { body: "fixed" })).rejects.toThrow(/author/);
    await editPost(db, p.id, "alex", { body: "fixed" });
    expect((await getPost(db, p.id))?.post.body).toBe("fixed");
    await expect(deletePost(db, p.id, "sam")).rejects.toThrow(/author/);
  });
  it("attaches media to a text post, turning it into that kind with an optional caption", async () => {
    const { db, season, alex } = await setup();
    const p = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "the words" },
      DAY7,
    );
    await editPost(db, p.id, "alex", {
      body: "",
      media: { url: "https://blob/x.jpg", type: "photo" },
    });
    const row = (await getPost(db, p.id))?.post;
    expect(row?.type).toBe("photo");
    expect(row?.mediaUrl).toBe("https://blob/x.jpg");
    // The caption cleared to nothing, which a text post may not do but a photo post may.
    expect(row?.body).toBeNull();
  });
  it("refuses to leave a text post with neither words nor media", async () => {
    const { db, season, alex } = await setup();
    const p = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "the words" },
      DAY7,
    );
    await expect(editPost(db, p.id, "alex", { body: "   " })).rejects.toThrow(/text or media/);
  });
  it("hiding a post takes it off the wall, and unhiding brings it back", async () => {
    const { db, season, alex } = await setup();
    const p = await createPost(
      db,
      { seasonId: season.id, author: "alex", skinId: alex.id, type: "text", body: "on the wall" },
      DAY7,
    );
    const onWall = async () => (await listWall(db, season.id)).some((i) => i.post.id === p.id);
    expect(await onWall()).toBe(true);
    await setHidden(db, p.id, "alex", true);
    expect(await onWall()).toBe(false);
    // Reversible, unlike delete: the row is still there to bring back.
    await setHidden(db, p.id, "alex", false);
    expect(await onWall()).toBe(true);
    await expect(setHidden(db, p.id, "sam", true)).rejects.toThrow(/author/);
  });
});
