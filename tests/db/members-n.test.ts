import { describe, expect, it } from "vitest";
import { checkpoints } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { memberIds } from "@/lib/members";
import { outstanding } from "@/lib/outstanding";
import { acceptBet, proposeBet } from "@/lib/repo/bets";
import { armBomb, bombsFor, openBomb } from "@/lib/repo/bombs";
import { openCheckpoint } from "@/lib/repo/checkpoints";
import { acceptDare, proposeDare } from "@/lib/repo/dares";
import { createSkin } from "@/lib/repo/skins";
import { addTrack, approveTrack, listApproved } from "@/lib/repo/tracks";
import { answer, answeredDays, answersFor, revealed } from "@/lib/repo/truth";
import { TEST_MEMBERS_MAP } from "../factories";

const IDS = memberIds(TEST_MEMBERS_MAP);
const DAY = 6;
const kinds = (rows: { kind: string }[]) => rows.map((r) => r.kind);

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  return { db, seasonId: season.id, skinId: skin.id };
}

describe("three members: bets", () => {
  it("only the chosen opponent answers, not a third member or the proposer", async () => {
    const { db, seasonId } = await setup();
    const bet = await proposeBet(db, {
      seasonId,
      proposer: "alex",
      opponent: "sam",
      claim: "she folds",
      stakes: "dinner",
    });
    await expect(acceptBet(db, bet.id, "jo")).rejects.toThrow(/other party/i);
    await expect(acceptBet(db, bet.id, "alex")).rejects.toThrow(/other party/i);
    await acceptBet(db, bet.id, "sam");
    const forJo = await outstanding(db, seasonId, "jo", TEST_MEMBERS_MAP, DAY);
    expect(kinds(forJo.mine)).not.toContain("bet");
    expect(kinds(forJo.theirs)).not.toContain("bet");
    expect(forJo.coming.some((c) => c.kind === "bet")).toBe(false);
  });

  it("refuses betting yourself or a stranger with a plain message", async () => {
    const { db, seasonId } = await setup();
    const base = { seasonId, proposer: "alex", claim: "she folds", stakes: "dinner" };
    await expect(proposeBet(db, { ...base, opponent: "alex" })).rejects.toThrow(/yourself/i);
    await expect(proposeBet(db, { ...base, opponent: "nobody" })).rejects.toThrow(
      /no such member/i,
    );
  });
});

describe("three members: dares", () => {
  it("is for the chosen member only", async () => {
    const { db, seasonId } = await setup();
    const dare = await proposeDare(db, {
      seasonId,
      darer: "alex",
      dared: "jo",
      body: "sing in the street",
    });
    expect(dare.dared).toBe("jo");
    await expect(acceptDare(db, dare.id, "sam")).rejects.toThrow(/dared/i);
    const forSam = await outstanding(db, seasonId, "sam", TEST_MEMBERS_MAP, DAY);
    expect(kinds(forSam.mine)).not.toContain("dare");
    expect(kinds(forSam.theirs)).not.toContain("dare");
    const forJo = await outstanding(db, seasonId, "jo", TEST_MEMBERS_MAP, DAY);
    expect(kinds(forJo.mine)).toContain("dare");
    const forAlex = await outstanding(db, seasonId, "alex", TEST_MEMBERS_MAP, DAY);
    expect(forAlex.theirs).toEqual([{ kind: "dare", count: 1, who: ["jo"] }]);
    await acceptDare(db, dare.id, "jo");
  });

  it("refuses daring yourself", async () => {
    const { db, seasonId } = await setup();
    await expect(
      proposeDare(db, { seasonId, darer: "alex", dared: "alex", body: "x" }),
    ).rejects.toThrow(/yourself/i);
  });
});

describe("three members: time bombs", () => {
  it("a third member cannot see or open it, and can read it once it is open", async () => {
    const { db, seasonId, skinId } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "jo",
        body: "look up",
        skinId,
        trigger: { kind: "day", detonateDay: 9 },
      },
      3,
    );
    expect(bomb.recipient).toBe("jo");
    expect(await bombsFor(db, seasonId, "sam", 9)).toEqual([]);
    expect((await bombsFor(db, seasonId, "jo", 9))[0].body).toBeNull();
    const now = new Date("2026-09-10T12:00:00Z");
    await expect(openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, now)).rejects.toThrow(
      /recipient/i,
    );
    await openBomb(db, { id: bomb.id, seasonId, viewer: "jo" }, now);
    expect((await bombsFor(db, seasonId, "sam", 9))[0].body).toBe("look up");
  });

  it("refuses sending one to yourself or a stranger", async () => {
    const { db, seasonId, skinId } = await setup();
    const base = {
      seasonId,
      sender: "alex",
      body: "look up",
      skinId,
      trigger: { kind: "day", detonateDay: 9 } as const,
    };
    await expect(armBomb(db, { ...base, recipient: "alex" }, 3)).rejects.toThrow(/yourself/i);
    await expect(armBomb(db, { ...base, recipient: "nobody" }, 3)).rejects.toThrow(
      /no such member/i,
    );
  });
});

describe("three members: tracks", () => {
  it("any member but the author approves it", async () => {
    const { db, seasonId } = await setup();
    const meta = { url: "https://open.spotify.com/track/a", title: "So Back" };
    const track = await addTrack(db, { seasonId, author: "alex", day: 3, meta });
    await expect(
      approveTrack(db, { id: track.id, seasonId, viewer: "alex" }, new Date()),
    ).rejects.toThrow(/other person/i);
    const approved = await approveTrack(db, { id: track.id, seasonId, viewer: "jo" }, new Date());
    expect(approved.approvedBy).toBe("jo");
    expect(await listApproved(db, seasonId)).toHaveLength(1);
  });
});

describe("three members: truth reveal", () => {
  it("is not revealed the same day with one member absent, and is after the day rolls", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: 4, author: "alex", body: "a" }, IDS, 4);
    await answer(db, { seasonId, day: 4, author: "sam", body: "b" }, IDS, 4);
    const rows = await answersFor(db, seasonId, 4);
    expect(revealed(rows, IDS, 4, 4)).toBe(false);
    expect(await answeredDays(db, seasonId, IDS, 4)).toEqual([]);
    await answer(db, { seasonId, day: 4, author: "alex", body: "a2" }, IDS, 4);
    expect(revealed(rows, IDS, 4, 5)).toBe(true);
    expect(await answeredDays(db, seasonId, IDS, 5)).toEqual([4]);
    await expect(
      answer(db, { seasonId, day: 4, author: "jo", body: "late" }, IDS, 5),
    ).rejects.toThrow(/already in/i);
  });

  it("is revealed the same day once all three have answered", async () => {
    const { db, seasonId } = await setup();
    for (const author of IDS) await answer(db, { seasonId, day: 4, author, body: author }, IDS, 4);
    expect(revealed(await answersFor(db, seasonId, 4), IDS, 4, 4)).toBe(true);
  });
});

describe("three members: outstanding", () => {
  it("waits on every member who has not answered", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: DAY, author: "alex", body: "a" }, IDS, DAY);
    const out = await outstanding(db, seasonId, "alex", TEST_MEMBERS_MAP, DAY);
    expect(out.theirs).toEqual([{ kind: "truth", count: 1, who: ["sam", "jo"] }]);
  });

  it("a pending checkpoint reaches every member, and the first opener wins", async () => {
    const { db, seasonId } = await setup();
    await createSkin(db, { seasonId, owner: "jo", name: "Jo" });
    const [row] = await db.insert(checkpoints).values({ seasonId, day: 10 }).returning();
    for (const me of IDS) {
      const out = await outstanding(db, seasonId, me, TEST_MEMBERS_MAP, DAY);
      expect(kinds(out.mine)).toContain("checkpoint");
    }
    const opened = await openCheckpoint(
      db,
      seasonId,
      row.id,
      "jo",
      new Date("2026-09-11T12:00:00Z"),
    );
    expect(opened.openedBy).toBe("jo");
    const out = await outstanding(db, seasonId, "sam", TEST_MEMBERS_MAP, DAY);
    expect(kinds(out.mine)).not.toContain("checkpoint");
  });
});
