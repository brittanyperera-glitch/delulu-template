import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";

let testDb: Db;
let seasonId: number;

vi.mock("@/lib/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({
    player: "sam" as const,
    season: { id: seasonId },
    day: 10,
    rollover: null,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { trululuAction } from "@/actions/delusions";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addDelusion, listDelusions } from "@/lib/repo/delusions";
import { createPost, deletePost } from "@/lib/repo/posts";
import { createSkin } from "@/lib/repo/skins";

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
});

describe("trululuAction", () => {
  it("refuses to flip against a post that was deleted before the claim, and never flips it", async () => {
    const skin = await createSkin(testDb, { seasonId, owner: "alex", name: "CEO Alex" });
    const delusion = await addDelusion(testDb, {
      seasonId,
      about: "alex",
      addedBy: "sam",
      body: "signs a record deal",
    });
    const post = await createPost(testDb, {
      seasonId,
      author: "alex",
      skinId: skin.id,
      type: "text",
      body: "gone by the time you tap it",
    });
    // Deleted after it was offered in the pill list, before the flip is claimed.
    await deletePost(testDb, post.id, "alex");

    await expect(trululuAction({ id: delusion.id, postId: post.id })).rejects.toThrow();

    const [after] = await listDelusions(testDb, seasonId);
    expect(after.trululuPostId).toBeNull();
  });
});
