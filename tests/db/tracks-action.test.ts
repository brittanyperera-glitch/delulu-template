import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";

let testDb: Db;
let seasonId: number;

vi.mock("@/lib/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({
    player: "alex" as const,
    season: { id: seasonId },
    day: 10,
    rollover: null,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/unfurl", () => ({
  unfurl: async (url: string) => ({ url, title: "So Back" }),
}));

import { addTrackAction } from "@/actions/tracks";
import { posts } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createSkin } from "@/lib/repo/skins";
import { addTrack } from "@/lib/repo/tracks";

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
});

describe("addTrackAction", () => {
  it("does not leave a duplicate wall post when the track is already on the soundtrack", async () => {
    const url = "https://open.spotify.com/track/dup";
    await addTrack(testDb, { seasonId, author: "alex", day: 3, meta: { url, title: "So Back" } });
    const skin = await createSkin(testDb, { seasonId, owner: "alex", name: "CEO Alex" });

    await expect(addTrackAction({ url, skinId: skin.id })).rejects.toThrow(/already/i);

    const rows = await testDb.select().from(posts).where(eq(posts.seasonId, seasonId));
    expect(rows).toHaveLength(0);
  });
});
