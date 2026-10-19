import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { acceptDare, chickenOut, listDares, proposeDare } from "@/lib/repo/dares";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

describe("dares", () => {
  it("deals to the other player and lists newest first", async () => {
    const { db, seasonId } = await setup();
    await proposeDare(db, {
      seasonId,
      darer: "alex",
      dared: "sam",
      body: "sing in the street",
      stake: "loser buys coffee",
    });
    await proposeDare(db, { seasonId, darer: "sam", dared: "alex", body: "cold shower at dawn" });
    const list = await listDares(db, seasonId);
    expect(list.map((d) => d.body)).toEqual(["cold shower at dawn", "sing in the street"]);
    expect(list[0].darer).toBe("sam");
    expect(list[0].dared).toBe("alex");
    expect(list[0].stake).toBeNull();
    expect(list[1].stake).toBe("loser buys coffee");
    expect(list[0].status).toBe("open");
  });

  it("only the dared person accepts", async () => {
    const { db, seasonId } = await setup();
    const d = await proposeDare(db, {
      seasonId,
      darer: "alex",
      dared: "sam",
      body: "sing in the street",
    });
    await expect(acceptDare(db, d.id, "alex")).rejects.toThrow(/dared/i);
    await acceptDare(db, d.id, "sam");
    expect((await listDares(db, seasonId))[0].status).toBe("accepted");
  });

  it("chickening out is permanent", async () => {
    const { db, seasonId } = await setup();
    const d = await proposeDare(db, { seasonId, darer: "alex", dared: "sam", body: "karaoke" });
    await chickenOut(db, d.id, "sam");
    expect((await listDares(db, seasonId))[0].status).toBe("chickened");
    await expect(acceptDare(db, d.id, "sam")).rejects.toThrow(/already/i);
    await expect(chickenOut(db, d.id, "sam")).rejects.toThrow(/already/i);
  });

  it("refuses an empty or over-long dare and an over-long stake", async () => {
    const { db, seasonId } = await setup();
    await expect(
      proposeDare(db, { seasonId, darer: "alex", dared: "sam", body: "  " }),
    ).rejects.toThrow(/dare/i);
    await expect(
      proposeDare(db, { seasonId, darer: "alex", dared: "sam", body: "x".repeat(201) }),
    ).rejects.toThrow(/dare/i);
    await expect(
      proposeDare(db, { seasonId, darer: "alex", dared: "sam", body: "ok", stake: "x".repeat(81) }),
    ).rejects.toThrow(/stake/i);
  });
});
