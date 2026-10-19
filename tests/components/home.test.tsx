// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Outstanding, RoomCounts } from "@/lib/outstanding";
import type { BombView } from "@/lib/repo/bombs";

vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({
    player: "alex" as const,
    season: { id: 1 },
    day: 5,
    rollover: null,
  }),
}));
vi.mock("@/lib/db/client", () => ({ db: () => ({}) }));
// db() is a stub here, so the page's member read cannot hit it.
vi.mock("@/lib/session", async () => ({
  getMembers: async () => (await import("../factories")).TEST_MEMBERS_MAP,
}));
// currentManifesto returns the BODY, not the row. The old mock returned a row and got away
// with it only because pickSentence was mocked too and ignored it; the wall now renders the
// manifesto in full, so the mock has to be the real shape.
vi.mock("@/lib/manifesto", () => ({
  currentManifesto: async () => "I am so back. Delulu season commences.",
}));
// listWall stubbed; tiltFor stays real so a populated wall (this file's newer test) renders
// through Scrap without every prior empty-wall test needing to know it exists.
vi.mock("@/lib/repo/posts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repo/posts")>();
  return { ...actual, listWall: vi.fn() };
});
vi.mock("@/lib/repo/delusions", () => ({ listDelusions: async () => [] }));
vi.mock("@/lib/repo/spoilers", () => ({ listSpoilers: async () => [] }));
vi.mock("@/lib/repo/section-post", () => ({ defaultSkinId: async () => null }));
vi.mock("@/lib/outstanding", () => ({ wallState: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import Home from "@/app/page";
import { STRINGS } from "@/lib/content/strings";
import { wallState } from "@/lib/outstanding";
import { listWall } from "@/lib/repo/posts";
import { postRow, skinRow } from "../factories";
import { render } from "./members-wrapper";

const COUNTS: RoomCounts = {
  dares: 0,
  bets: 0,
  truthAnswered: false,
  jar: 0,
  bombs: 0,
  prophecies: 0,
  nextCheckpoint: 10,
  skins: 0,
  tracks: 0,
};

function state(moves: Partial<Outstanding> = {}) {
  return {
    moves: { mine: [], theirs: [], coming: [], ...moves },
    counts: COUNTS,
    skins: [],
  };
}

describe("Home", () => {
  it("offers exactly one route to the composer on day one, when the wall is empty", async () => {
    vi.mocked(listWall).mockResolvedValue([]);
    vi.mocked(wallState).mockResolvedValue(state());
    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("button", { name: STRINGS.home.first })).toBeInTheDocument();
    // The Fab carries this same accessible name (STRINGS.home.add) and must not also render here.
    expect(screen.queryByLabelText(STRINGS.home.add)).toBeNull();
  });

  it("keeps the Fab once the empty-wall banner is not shown", async () => {
    // items stays empty, but `before` is set (a paged-through view), so the empty-state banner
    // does not apply and the Fab is the only route back to the composer.
    vi.mocked(listWall).mockResolvedValue([]);
    vi.mocked(wallState).mockResolvedValue(state());
    render(await Home({ searchParams: Promise.resolve({ before: "5" }) }));
    expect(screen.getByLabelText(STRINGS.home.add)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: STRINGS.home.first })).toBeNull();
  });

  // The hierarchy is the whole point of the redesign: what needs doing is the loudest thing,
  // and the day count is a stamp rather than the hero it used to be.
  it("makes the tray a heading and shows the day and the count when something is waiting", async () => {
    vi.mocked(listWall).mockResolvedValue([]);
    vi.mocked(wallState).mockResolvedValue(
      state({
        mine: [{ kind: "truth", question: "what would you do with a free year?" }],
      }),
    );
    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: STRINGS.wall.yourMove, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("what would you do with a free year?")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.home.dayOf(5, 100))).toBeInTheDocument();
    // The count came back, louder, on request after seeing the wall open flat.
    expect(screen.getByText(STRINGS.home.daysLeft)).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("flips to what is coming when nothing is waiting on you", async () => {
    vi.mocked(listWall).mockResolvedValue([]);
    vi.mocked(wallState).mockResolvedValue(
      state({ coming: [{ kind: "checkpoint", day: 10, away: 5 }] }),
    );
    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: STRINGS.wall.allClear, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: STRINGS.wall.yourMove })).toBeNull();
  });

  // The bug this guards: a ticking bomb used to live only in the all-clear view, so the moment
  // anything sat in the tray it vanished. It must show alongside the tray now.
  it("keeps a ticking bomb on the wall even when the tray is full", async () => {
    vi.mocked(listWall).mockResolvedValue([]);
    const bomb: BombView = {
      id: 7,
      sender: "sam",
      recipient: "alex",
      armedDay: 1,
      mine: false,
      detonated: false,
      due: false,
      fuse: { kind: "day", daysLeft: 42, percent: 30 },
      body: null,
    };
    vi.mocked(wallState).mockResolvedValue(
      state({
        mine: [{ kind: "truth", question: "what would you do with a free year?" }],
        coming: [{ kind: "bomb", bomb }],
      }),
    );
    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: STRINGS.wall.yourMove, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: STRINGS.wall.ticking, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bombs.dMinus(42))).toBeInTheDocument();
  });

  // The tray guards the sidebar; this guards the FEED itself, which used to show a coming
  // bomb nowhere but that sidebar strip even once posts existed to scroll past.
  it("also renders a coming bomb in the wall feed, worded for the sender, when the wall has posts", async () => {
    vi.mocked(listWall).mockResolvedValue([
      { post: postRow({ id: 21 }), skin: skinRow(), reactions: [], comments: [], commentCount: 0 },
    ]);
    const bomb: BombView = {
      id: 8,
      sender: "alex",
      recipient: "sam",
      armedDay: 1,
      mine: true,
      detonated: false,
      due: false,
      fuse: { kind: "day", daysLeft: 3, percent: 60 },
      body: null,
    };
    vi.mocked(wallState).mockResolvedValue(state({ coming: [{ kind: "bomb", bomb }] }));
    render(await Home({ searchParams: Promise.resolve({}) }));
    // wallSent/wallFrom are the wording SealedBomb and TickingBombCard use; the sidebar
    // TickingBombs strip never prints them, so finding one proves the feed card is real.
    expect(screen.getByText(STRINGS.bombs.wallSent)).toBeInTheDocument();
    // The countdown appears twice on purpose: once in the sidebar tray, once on the card.
    expect(screen.getAllByText(STRINGS.bombs.dMinus(3))).toHaveLength(2);
  });

  it("shows one filter row and no section pill row", async () => {
    vi.mocked(listWall).mockResolvedValue([]);
    vi.mocked(wallState).mockResolvedValue(state());
    render(await Home({ searchParams: Promise.resolve({}) }));
    // The filter row survives; the thirteen-section nav that used to sit beside it is gone,
    // so one pill row on the wall now means exactly one thing.
    expect(screen.getByText(STRINGS.filters.all)).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.nav.delusions)).toBeNull();
    expect(screen.queryByText(STRINGS.nav.jar)).toBeNull();
  });
});
