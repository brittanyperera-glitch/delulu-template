import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import {
  acceptDare,
  chickenOut,
  claimDareDone,
  dareById,
  negotiateDare,
  proposeDare,
  resolveNegotiation,
} from "@/lib/repo/dares";
import { listWall } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";

const DAY7 = new Date("2026-09-08T12:00:00Z");

async function dealt() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
  const dare = await proposeDare(db, {
    seasonId: season.id,
    darer: "alex",
    dared: "sam",
    body: "sing in the street",
  });
  return { db, seasonId: season.id, skinId: skin.id, dare };
}

describe("negotiation", () => {
  it("the dared counters and the darer takes it", async () => {
    const { db, dare } = await dealt();
    await expect(negotiateDare(db, dare.id, "alex", "hum it")).rejects.toThrow(/dared/i);
    await negotiateDare(db, dare.id, "sam", "hum it in a shop");
    let now = await dareById(db, dare.id);
    expect(now?.status).toBe("negotiating");
    expect(now?.counter).toBe("hum it in a shop");
    await expect(resolveNegotiation(db, dare.id, "sam", true)).rejects.toThrow(/darer/i);
    await resolveNegotiation(db, dare.id, "alex", true);
    now = await dareById(db, dare.id);
    expect(now?.status).toBe("accepted");
    expect(now?.body).toBe("hum it in a shop");
    expect(now?.counter).toBeNull();
  });

  it("a declined counter puts the dare back as it was", async () => {
    const { db, dare } = await dealt();
    await negotiateDare(db, dare.id, "sam", "hum it");
    await resolveNegotiation(db, dare.id, "alex", false);
    const now = await dareById(db, dare.id);
    expect(now?.status).toBe("open");
    expect(now?.body).toBe("sing in the street");
    expect(now?.counter).toBeNull();
  });

  it("Done posts once with DARED", async () => {
    const { db, seasonId, skinId, dare } = await dealt();
    await negotiateDare(db, dare.id, "sam", "hum it");
    await resolveNegotiation(db, dare.id, "alex", true);
    const post = await postAndClaim(
      db,
      { seasonId, author: "sam", skinId, source: "dare", type: "text", body: "hum it" },
      (postId) => claimDareDone(db, dare.id, postId, 7),
      DAY7,
    );
    expect(post?.stamps).toEqual(["DARED"]);
    expect((await dareById(db, dare.id))?.status).toBe("done");
    expect(await claimDareDone(db, dare.id, 999, 8)).toHaveLength(0);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("clears the counter when a pending counter is accepted outright", async () => {
    const { db, dare } = await dealt();
    await negotiateDare(db, dare.id, "sam", "hum it");
    await acceptDare(db, dare.id, "sam");
    const now = await dareById(db, dare.id);
    expect(now?.status).toBe("accepted");
    expect(now?.counter).toBeNull();
  });

  it("clears the counter when chickening out of a pending counter", async () => {
    const { db, dare } = await dealt();
    await negotiateDare(db, dare.id, "sam", "hum it");
    await chickenOut(db, dare.id, "sam");
    const now = await dareById(db, dare.id);
    expect(now?.status).toBe("chickened");
    expect(now?.counter).toBeNull();
  });

  it("refuses an empty or over-long counter", async () => {
    const { db, dare } = await dealt();
    await expect(negotiateDare(db, dare.id, "sam", " ")).rejects.toThrow(/counter/i);
    await expect(negotiateDare(db, dare.id, "sam", "x".repeat(201))).rejects.toThrow(/counter/i);
  });
});
