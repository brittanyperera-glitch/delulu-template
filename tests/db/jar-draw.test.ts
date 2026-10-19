import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import {
  addJarItem,
  claimDone,
  countsBySize,
  drawFromJar,
  drawnFor,
  listJar,
  putBack,
} from "@/lib/repo/jar";
import { listWall } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";

const DAY7 = new Date("2026-09-08T12:00:00Z");
const first = () => 0;

async function stocked() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  await addJarItem(db, {
    seasonId: season.id,
    author: "alex",
    body: "cold plunge",
    size: "feral",
  });
  await addJarItem(db, {
    seasonId: season.id,
    author: "sam",
    body: "sauna then snow",
    size: "feral",
  });
  await addJarItem(db, {
    seasonId: season.id,
    author: "sam",
    body: "pasta from scratch",
    size: "tonight",
  });
  return { db, seasonId: season.id, skinId: skin.id };
}

describe("the draw", () => {
  it("stays inside the chosen size and takes the slip out of the jar", async () => {
    const { db, seasonId } = await stocked();
    const drawn = await drawFromJar(db, seasonId, "tonight", "alex", DAY7, first);
    expect(drawn?.body).toBe("pasta from scratch");
    expect(drawn?.drawnBy).toBe("alex");
    expect((await countsBySize(db, seasonId)).tonight).toBe(0);
    expect((await drawnFor(db, seasonId, "alex"))?.id).toBe(drawn?.id);
  });

  it("returns null when the size is empty", async () => {
    const { db, seasonId } = await stocked();
    expect(await drawFromJar(db, seasonId, "tiny", "alex", DAY7, first)).toBeNull();
  });

  it("never draws the same slip twice", async () => {
    const { db, seasonId } = await stocked();
    const a = await drawFromJar(db, seasonId, "feral", "alex", DAY7, first);
    const b = await drawFromJar(db, seasonId, "feral", "sam", DAY7, first);
    expect(a?.id).not.toBe(b?.id);
    expect(await drawFromJar(db, seasonId, "feral", "alex", DAY7, first)).toBeNull();
  });

  it("puts a slip back with a visible count", async () => {
    const { db, seasonId } = await stocked();
    const drawn = await drawFromJar(db, seasonId, "tonight", "alex", DAY7, first);
    if (!drawn) throw new Error("nothing drawn");
    await putBack(db, drawn.id, "alex");
    const again = (await listJar(db, seasonId)).find((i) => i.id === drawn.id);
    expect(again?.putBackCount).toBe(1);
    expect(again?.drawnAt).toBeNull();
    expect((await countsBySize(db, seasonId)).tonight).toBe(1);
  });

  it("Done posts it once with FROM THE JAR", async () => {
    const { db, seasonId, skinId } = await stocked();
    const drawn = await drawFromJar(db, seasonId, "tonight", "alex", DAY7, first);
    if (!drawn) throw new Error("nothing drawn");
    const post = await postAndClaim(
      db,
      { seasonId, author: "alex", skinId, source: "jar", type: "text", body: drawn.body },
      (postId) => claimDone(db, drawn.id, postId, 7),
      DAY7,
    );
    expect(post?.stamps).toEqual(["FROM THE JAR"]);
    expect(await claimDone(db, drawn.id, 999, 8)).toHaveLength(0);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });
});
