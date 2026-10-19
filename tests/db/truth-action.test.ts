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

import { answerTruthAction } from "@/actions/truth";
import { truthAnswers } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
});

describe("answerTruthAction", () => {
  it("records against today's day from dayContext, ignoring a client-supplied day", async () => {
    // dayContext is mocked to day 10; the action takes no day argument at all any more, so
    // there is nothing a caller could pass to answer any other day.
    await answerTruthAction("an answer for the wrong day");
    const rows = await testDb
      .select()
      .from(truthAnswers)
      .where(eq(truthAnswers.seasonId, seasonId));
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe(10);
  });
});
