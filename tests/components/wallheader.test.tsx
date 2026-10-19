// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WallHeader } from "@/components/WallHeader";
import { STRINGS } from "@/lib/content/strings";
import type { RoomCounts } from "@/lib/outstanding";
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

describe("WallHeader", () => {
  it("offers the way out", () => {
    render(<WallHeader counts={COUNTS} me="alex" />);
    expect(screen.getByRole("button", { name: STRINGS.wall.rooms })).toBeInTheDocument();
  });

  // The day lives in TitleCard. Showing it here as well put "Day 5 of 100" on screen twice.
  it("does not also print the day", () => {
    render(<WallHeader counts={COUNTS} me="alex" />);
    expect(screen.queryByText(/Day \d+ of \d+/)).toBeNull();
  });
});
