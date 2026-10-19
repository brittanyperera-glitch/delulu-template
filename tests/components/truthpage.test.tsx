// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";

let testDb: Db;
let seasonId: number;

vi.mock("@/lib/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({
    player: "alex" as const,
    season: { id: seasonId },
    day: 5,
    rollover: null,
  }),
}));

import TruthPage from "@/app/truth/page";
import { createTestDb, currentSeason } from "@/lib/db/test-db";

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
});

describe("TruthPage", () => {
  it("answers a non-numeric day with a clean 404, not a raw NaN reaching the database", async () => {
    // Unguarded, Number("abc") is NaN and drizzle sends it straight into the query params
    // ("Failed query: ... params: 1,NaN"), a bare 500 with no digest. The guard pattern reused
    // from post/[id]/page.tsx instead throws Next's own notFound(), tagged with the 404 digest.
    let caught: unknown;
    try {
      await TruthPage({ searchParams: Promise.resolve({ day: "abc" }) });
    } catch (e) {
      caught = e;
    }
    expect((caught as { digest?: string } | undefined)?.digest).toMatch(/NEXT_HTTP_ERROR_FALLBACK/);
  });

  it("still renders a real day", async () => {
    const el = await TruthPage({ searchParams: Promise.resolve({ day: "5" }) });
    expect(el).toBeTruthy();
  });
});
