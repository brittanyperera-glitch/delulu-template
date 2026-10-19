import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import {
  acceptBet,
  betById,
  claimSettled,
  declineBet,
  proposeBet,
  receiptBody,
} from "@/lib/repo/bets";
import { listWall } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";
import { createSkin } from "@/lib/repo/skins";
import { TEST_MEMBERS_MAP } from "../factories";

const DAY7 = new Date("2026-09-08T12:00:00Z");

async function proposed() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
  const bet = await proposeBet(db, {
    seasonId: season.id,
    proposer: "alex",
    opponent: "sam",
    claim: "she runs it under four hours",
    stakes: "dinner, his choice",
  });
  return { db, seasonId: season.id, skinId: skin.id, bet };
}

describe("bets", () => {
  it("opens as proposed and only the other player answers", async () => {
    const { db, bet } = await proposed();
    expect(bet.status).toBe("proposed");
    await expect(acceptBet(db, bet.id, "alex")).rejects.toThrow(/other/i);
    await acceptBet(db, bet.id, "sam");
    expect((await betById(db, bet.id))?.status).toBe("open");
    await expect(acceptBet(db, bet.id, "sam")).rejects.toThrow(/moved on/i);
  });

  it("declining closes it", async () => {
    const { db, bet } = await proposed();
    await declineBet(db, bet.id, "sam");
    expect((await betById(db, bet.id))?.status).toBe("declined");
    await expect(acceptBet(db, bet.id, "sam")).rejects.toThrow(/moved on/i);
  });

  it("the loser settles it once and the receipt lands on the wall", async () => {
    const { db, seasonId, skinId, bet } = await proposed();
    await acceptBet(db, bet.id, "sam");
    const post = await postAndClaim(
      db,
      {
        seasonId,
        author: "sam",
        skinId,
        source: "bet",
        type: "text",
        body: receiptBody(bet, "sam", TEST_MEMBERS_MAP),
      },
      (postId) => claimSettled(db, bet.id, "sam", postId, 7),
      DAY7,
    );
    expect(post?.stamps).toEqual(["RECEIPT"]);
    expect(post?.body).toContain("dinner, his choice");
    const settled = await betById(db, bet.id);
    expect(settled?.status).toBe("settled");
    expect(settled?.loser).toBe("sam");
    expect(settled?.settledDay).toBe(7);
    expect(await claimSettled(db, bet.id, "alex", 999, 8)).toHaveLength(0);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("refuses an empty claim, an empty stake and over-long text", async () => {
    const { db, seasonId } = await proposed();
    await expect(
      proposeBet(db, { seasonId, proposer: "alex", opponent: "sam", claim: " ", stakes: "dinner" }),
    ).rejects.toThrow(/claim/i);
    await expect(
      proposeBet(db, {
        seasonId,
        proposer: "alex",
        opponent: "sam",
        claim: "a thing",
        stakes: " ",
      }),
    ).rejects.toThrow(/stakes/i);
    await expect(
      proposeBet(db, {
        seasonId,
        proposer: "alex",
        opponent: "sam",
        claim: "x".repeat(201),
        stakes: "dinner",
      }),
    ).rejects.toThrow(/claim/i);
  });
});
