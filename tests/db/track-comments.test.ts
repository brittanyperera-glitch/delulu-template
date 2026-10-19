import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addTrackComment, listTrackComments } from "@/lib/repo/track-comments";
import { addTrack } from "@/lib/repo/tracks";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const track = await addTrack(db, {
    seasonId: season.id,
    author: "alex",
    day: 3,
    meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
  });
  return { db, seasonId: season.id, trackId: track.id };
}

describe("track comments", () => {
  it("lists top-level comments oldest first, each carrying its own replies oldest first", async () => {
    const { db, trackId } = await setup();
    const first = await addTrackComment(db, { trackId, author: "alex", body: "love this one" });
    const second = await addTrackComment(db, { trackId, author: "sam", body: "same" });
    const reply = await addTrackComment(db, {
      trackId,
      author: "sam",
      body: "obsessed",
      parentId: first.id,
    });

    const thread = await listTrackComments(db, trackId);

    expect(thread.map((c) => c.id)).toEqual([first.id, second.id]);
    expect(thread[0].replies.map((r) => r.id)).toEqual([reply.id]);
    expect(thread[1].replies).toEqual([]);
  });

  it("keeps the author and body on a reply, pointed at its parent", async () => {
    const { db, trackId } = await setup();
    const top = await addTrackComment(db, { trackId, author: "alex", body: "top" });
    const reply = await addTrackComment(db, {
      trackId,
      author: "sam",
      body: "a reply",
      parentId: top.id,
    });

    expect(reply.parentId).toBe(top.id);
    expect(reply.author).toBe("sam");

    const thread = await listTrackComments(db, trackId);
    expect(thread[0].replies[0].body).toBe("a reply");
  });

  it("only shows comments for the given track", async () => {
    const { db, seasonId, trackId } = await setup();
    const other = await addTrack(db, {
      seasonId,
      author: "sam",
      day: 4,
      meta: { url: "https://open.spotify.com/track/b", title: "Different Track" },
    });
    await addTrackComment(db, { trackId, author: "alex", body: "on track a" });
    await addTrackComment(db, { trackId: other.id, author: "sam", body: "on track b" });

    const thread = await listTrackComments(db, trackId);
    expect(thread).toHaveLength(1);
    expect(thread[0].body).toBe("on track a");
  });
});
