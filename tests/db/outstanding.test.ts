import { describe, expect, it } from "vitest";
import { TOTAL_DAYS } from "@/lib/days";
import { createTestDb, currentSeason, TEST_MEMBERS } from "@/lib/db/test-db";
import { memberList, toMembersMap } from "@/lib/members";
import { outstanding, wallState } from "@/lib/outstanding";
import { acceptBet, declineBet, proposeBet } from "@/lib/repo/bets";
import { acceptDare, chickenOut, negotiateDare, proposeDare } from "@/lib/repo/dares";
import { addProphecy } from "@/lib/repo/prophecies";
import { answer } from "@/lib/repo/truth";
import { TEST_MEMBERS_MAP } from "../factories";

// These cases are two-person scenarios, so they run on a two-member season.
const PAIR_MAP = toMembersMap(memberList(TEST_MEMBERS_MAP).slice(0, 2));
const PAIR = ["alex", "sam"];

async function setup() {
  const db = await createTestDb(TEST_MEMBERS.slice(0, 2));
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

const DAY = 6;

describe("outstanding", () => {
  it("puts today's unanswered question on you, and nothing on them", async () => {
    const { db, seasonId } = await setup();
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(out.mine.map((m) => m.kind)).toContain("truth");
    expect(out.theirs.map((w) => w.kind)).not.toContain("truth");
  });

  it("moves the question to them once you have answered and they have not", async () => {
    const { db, seasonId } = await setup();
    await answer(
      db,
      { seasonId, day: DAY, author: "alex", body: "a free year, obviously" },
      PAIR,
      DAY,
    );
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(out.mine.map((m) => m.kind)).not.toContain("truth");
    expect(out.theirs.map((w) => w.kind)).toContain("truth");
  });

  it("says nothing about the question once both have answered", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: DAY, author: "alex", body: "mine" }, PAIR, DAY);
    await answer(db, { seasonId, day: DAY, author: "sam", body: "his" }, PAIR, DAY);
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(out.mine.map((m) => m.kind)).not.toContain("truth");
    expect(out.theirs.map((w) => w.kind)).not.toContain("truth");
  });

  it("gives an open dare to the person it was dealt to", async () => {
    const { db, seasonId } = await setup();
    await proposeDare(db, { seasonId, darer: "sam", dared: "alex", body: "sing in the street" });
    const forAlex = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const forSam = await outstanding(db, seasonId, "sam", PAIR_MAP, DAY);
    expect(forAlex.mine.map((m) => m.kind)).toContain("dare");
    expect(forSam.mine.map((m) => m.kind)).not.toContain("dare");
    expect(forSam.theirs.map((w) => w.kind)).toContain("dare");
  });

  // The rule I got wrong first time: a counter goes BACK to the darer, because
  // resolveNegotiation refuses anyone else. Without this the tray would tell the wrong
  // person to act, and the button they were offered would throw.
  it("sends a negotiated dare back to the darer, not the dared", async () => {
    const { db, seasonId } = await setup();
    const dare = await proposeDare(db, {
      seasonId,
      darer: "sam",
      dared: "alex",
      body: "cold shower",
    });
    await negotiateDare(db, dare.id, "alex", "warm shower, still brave");
    const forAlex = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const forSam = await outstanding(db, seasonId, "sam", PAIR_MAP, DAY);
    expect(forSam.mine.map((m) => m.kind)).toContain("dare");
    expect(forAlex.mine.map((m) => m.kind)).not.toContain("dare");
    expect(forAlex.theirs.map((w) => w.kind)).toContain("dare");
  });

  it("gives a proposed bet to whoever did not propose it", async () => {
    const { db, seasonId } = await setup();
    await proposeBet(db, {
      seasonId,
      proposer: "sam",
      opponent: "alex",
      claim: "she will not last a week",
      stakes: "dinner",
    });
    const forAlex = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const forSam = await outstanding(db, seasonId, "sam", PAIR_MAP, DAY);
    expect(forAlex.mine.map((m) => m.kind)).toContain("bet");
    expect(forSam.theirs.map((w) => w.kind)).toContain("bet");
  });

  // Prophecies cannot be judged until day 100, and prophecies.day holds the day one was
  // WRITTEN, so a column predicate on it would match nothing forever. This test creates a
  // real prophecy on purpose: asserting an empty result over an empty table proved nothing,
  // and stayed green with the day gate deleted.
  it("never asks for a prophecy verdict before day 100, even with one waiting", async () => {
    const { db, seasonId } = await setup();
    await addProphecy(db, { seasonId, author: "sam", about: "alex", body: "she moves" }, 3);
    const before = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(before.mine.map((m) => m.kind)).not.toContain("prophecy");
    expect(before.coming.some((c) => c.kind === "prophecy")).toBe(true);

    const atHundred = await outstanding(db, seasonId, "alex", PAIR_MAP, TOTAL_DAYS);
    expect(atHundred.mine.map((m) => m.kind)).toContain("prophecy");
  });

  it("counts the next checkpoint as coming, not as yours", async () => {
    const { db, seasonId } = await setup();
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const next = out.coming.find((c) => c.kind === "checkpoint");
    expect(next).toEqual({ kind: "checkpoint", day: 10, away: 4 });
  });

  it("carries no words in a waiting row, only a kind", async () => {
    const { db, seasonId } = await setup();
    await proposeDare(db, { seasonId, darer: "alex", dared: "sam", body: "the secret dare text" });
    const forAlex = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(forAlex.theirs).toEqual([{ kind: "dare", count: 1, who: ["sam"] }]);
  });
});

describe("outstanding, the rest of the surface", () => {
  // The leak this file exists to prevent. Anything on a Move reaches a client component and
  // therefore the page payload, rendered or not, so the truth row must carry the question
  // and nothing else. repo/truth.ts locks editing server-side for the same reason.
  it("puts no answer rows on the truth move", async () => {
    const { db, seasonId } = await setup();
    await answer(db, { seasonId, day: DAY, author: "sam", body: "his private answer" }, PAIR, DAY);
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const truth = out.mine.find((m) => m.kind === "truth");
    expect(truth).toBeDefined();
    expect(JSON.stringify(out)).not.toContain("his private answer");
  });

  it("keeps a settled or declined bet out of everything", async () => {
    const { db, seasonId } = await setup();
    const bet = await proposeBet(db, {
      seasonId,
      proposer: "sam",
      opponent: "alex",
      claim: "she folds",
      stakes: "dinner",
    });
    await declineBet(db, bet.id, "alex");
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(out.mine.map((m) => m.kind)).not.toContain("bet");
    expect(out.theirs.map((w) => w.kind)).not.toContain("bet");
    expect(out.coming.some((c) => c.kind === "bet")).toBe(false);
  });

  // Accepted and running is nobody's move, but it must not disappear.
  it("shows an accepted bet as coming and counts it in the drawer", async () => {
    const { db, seasonId } = await setup();
    const bet = await proposeBet(db, {
      seasonId,
      proposer: "sam",
      opponent: "alex",
      claim: "she folds",
      stakes: "dinner",
    });
    await acceptBet(db, bet.id, "alex");
    const state = await wallState(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(state.moves.mine.map((m) => m.kind)).not.toContain("bet");
    expect(state.moves.coming).toContainEqual({ kind: "bet", open: 1 });
    expect(state.counts.bets).toBe(1);
  });

  it("gives a chickened or done dare to nobody", async () => {
    const { db, seasonId } = await setup();
    const dare = await proposeDare(db, {
      seasonId,
      darer: "sam",
      dared: "alex",
      body: "cold shower",
    });
    await chickenOut(db, dare.id, "alex");
    const out = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    expect(out.mine.map((m) => m.kind)).not.toContain("dare");
    expect(out.theirs.map((w) => w.kind)).not.toContain("dare");
  });

  it("keeps an accepted dare with the person who has to do it", async () => {
    const { db, seasonId } = await setup();
    const dare = await proposeDare(db, { seasonId, darer: "sam", dared: "alex", body: "sing" });
    await acceptDare(db, dare.id, "alex");
    const forAlex = await outstanding(db, seasonId, "alex", PAIR_MAP, DAY);
    const forSam = await outstanding(db, seasonId, "sam", PAIR_MAP, DAY);
    expect(forAlex.mine.map((m) => m.kind)).toContain("dare");
    expect(forSam.mine.map((m) => m.kind)).not.toContain("dare");
  });
});
