import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  bets,
  bombs,
  checkpoints,
  comments,
  dares,
  delusions,
  jarItems,
  manifestoVersions,
  posts,
  prophecies,
  reactions,
  seasons,
  skins,
  spoilers,
  tracks,
  truthAnswers,
} from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/test-db";

// A screenshot of demo posts got read as real content and reported as a bug, because
// demo rows are indistinguishable from ours once they are on the wall. So starting the
// season writes the starter manifesto and nothing either of us could mistake for a post.
const MUST_BE_EMPTY = [
  ["skins", skins],
  ["posts", posts],
  ["reactions", reactions],
  ["comments", comments],
  ["delusions", delusions],
  ["spoilers", spoilers],
  ["jarItems", jarItems],
  ["dares", dares],
  ["bets", bets],
  ["tracks", tracks],
  ["bombs", bombs],
  ["prophecies", prophecies],
  ["truthAnswers", truthAnswers],
  ["checkpoints", checkpoints],
] as const;

describe("starting the season plants no content", () => {
  it("leaves every content table empty", async () => {
    const db = await createTestDb();
    for (const [name, table] of MUST_BE_EMPTY) {
      const [row] = await db.select({ n: count() }).from(table);
      expect(Number(row.n), `${name} should be empty after the season starts`).toBe(0);
    }
  });

  it("writes exactly one season and one manifesto", async () => {
    const db = await createTestDb();
    const [s] = await db.select({ n: count() }).from(seasons);
    const [m] = await db.select({ n: count() }).from(manifestoVersions);
    expect(Number(s.n)).toBe(1);
    expect(Number(m.n)).toBe(1);
  });
});
