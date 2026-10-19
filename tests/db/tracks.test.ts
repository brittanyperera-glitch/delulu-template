import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import {
  addTrack,
  approveTrack,
  listApproved,
  listSuggestions,
  listTracks,
} from "@/lib/repo/tracks";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

describe("tracks", () => {
  it("keeps title, artist, art and provider, oldest first", async () => {
    const { db, seasonId } = await setup();
    await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: {
        url: "https://open.spotify.com/track/a",
        title: "So Back",
        author: "The Delulus",
        image: "https://i/a.jpg",
        site: "Spotify",
        provider: "spotify",
      },
    });
    await addTrack(db, {
      seasonId,
      author: "sam",
      day: 5,
      meta: { url: "https://example.com/x", title: "example.com" },
    });
    const list = await listTracks(db, seasonId);
    expect(list.map((t) => t.title)).toEqual(["So Back", "example.com"]);
    expect(list[0].artist).toBe("The Delulus");
    expect(list[0].artUrl).toBe("https://i/a.jpg");
    expect(list[0].provider).toBe("spotify");
    expect(list[1].artist).toBeNull();
  });

  it("refuses the same link twice in a season", async () => {
    const { db, seasonId } = await setup();
    const meta = { url: "https://open.spotify.com/track/a", title: "So Back" };
    await addTrack(db, { seasonId, author: "alex", day: 3, meta });
    await expect(addTrack(db, { seasonId, author: "sam", day: 4, meta })).rejects.toThrow(
      /already/i,
    );
  });
});

describe("suggestions and the soundtrack", () => {
  it("lists only unapproved tracks as suggestions", async () => {
    const { db, seasonId } = await setup();
    const a = await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
    });
    await addTrack(db, {
      seasonId,
      author: "sam",
      day: 4,
      meta: { url: "https://open.spotify.com/track/b", title: "Delulu Anthem" },
    });
    await approveTrack(db, { id: a.id, seasonId, viewer: "sam" }, new Date());
    const suggestions = await listSuggestions(db, seasonId);
    expect(suggestions.map((t) => t.title)).toEqual(["Delulu Anthem"]);
    expect(suggestions.every((t) => t.approvedAt === null)).toBe(true);
  });

  it("lists only approved tracks, oldest approval first", async () => {
    const { db, seasonId } = await setup();
    const a = await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
    });
    const b = await addTrack(db, {
      seasonId,
      author: "sam",
      day: 4,
      meta: { url: "https://open.spotify.com/track/b", title: "Delulu Anthem" },
    });
    // Approved out of insertion order, so the assertion actually distinguishes approvedAt
    // ordering from id/createdAt ordering.
    await approveTrack(db, { id: b.id, seasonId, viewer: "alex" }, new Date("2026-09-05"));
    await approveTrack(db, { id: a.id, seasonId, viewer: "sam" }, new Date("2026-09-06"));
    const approved = await listApproved(db, seasonId);
    expect(approved.map((t) => t.title)).toEqual(["Delulu Anthem", "So Back"]);
  });

  it("lets the other person promote a suggestion", async () => {
    const { db, seasonId } = await setup();
    const track = await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
    });
    const now = new Date("2026-09-05");
    const approved = await approveTrack(db, { id: track.id, seasonId, viewer: "sam" }, now);
    expect(approved.approvedAt).toEqual(now);
    expect(approved.approvedBy).toBe("sam");
  });

  it("refuses the author approving their own suggestion", async () => {
    const { db, seasonId } = await setup();
    const track = await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
    });
    await expect(
      approveTrack(db, { id: track.id, seasonId, viewer: "alex" }, new Date()),
    ).rejects.toThrow(/only the other person/i);
    const reloaded = await listSuggestions(db, seasonId);
    expect(reloaded).toHaveLength(1);
  });

  it("is idempotent on an already-approved track", async () => {
    const { db, seasonId } = await setup();
    const track = await addTrack(db, {
      seasonId,
      author: "alex",
      day: 3,
      meta: { url: "https://open.spotify.com/track/a", title: "So Back" },
    });
    const first = await approveTrack(
      db,
      { id: track.id, seasonId, viewer: "sam" },
      new Date("2026-09-05"),
    );
    const second = await approveTrack(
      db,
      { id: track.id, seasonId, viewer: "sam" },
      new Date("2026-09-09"),
    );
    expect(second.approvedAt).toEqual(first.approvedAt);
    expect(second.approvedBy).toBe(first.approvedBy);
  });
});
