// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";

let testDb: Db;
let seasonId: number;
let oldVersionId: number;
let testDay = 5;

vi.mock("@/lib/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({
    player: "alex" as const,
    season: { id: seasonId },
    day: testDay,
    rollover: null,
  }),
}));

import ManifestoPage from "@/app/manifesto/page";
import { STRINGS } from "@/lib/content/strings";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { listVersions, MANIFESTO_V1, saveVersion } from "@/lib/manifesto";
import { render } from "./members-wrapper";

const V1_FIRST_LINE = MANIFESTO_V1.split("\n")[0];

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
  oldVersionId = (await listVersions(testDb, seasonId))[0].id;
  await saveVersion(testDb, { seasonId, author: "sam", day: 4, body: "Second version." });
});

describe("ManifestoPage day gate", () => {
  it("hides the rail and ignores ?v before Day 100", async () => {
    testDay = 5;
    render(await ManifestoPage({ searchParams: Promise.resolve({ v: String(oldVersionId) }) }));
    expect(
      screen.queryByRole("navigation", { name: STRINGS.manifesto.rail }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(STRINGS.manifesto.locked)).toBeInTheDocument();
    // ?v pointed at the old, pre-loaded version; ignored pre-100 means the current body shows.
    expect(screen.getByText("Second version.")).toBeInTheDocument();
    expect(screen.queryByText(V1_FIRST_LINE, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(STRINGS.manifesto.current)).not.toBeInTheDocument();
  });

  it("shows the rail and honors ?v on Day 100", async () => {
    testDay = 100;
    render(await ManifestoPage({ searchParams: Promise.resolve({ v: String(oldVersionId) }) }));
    expect(screen.getByRole("navigation", { name: STRINGS.manifesto.rail })).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.manifesto.locked)).not.toBeInTheDocument();
    expect(screen.getByText(V1_FIRST_LINE, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(STRINGS.manifesto.current)).toBeInTheDocument();
  });
});
