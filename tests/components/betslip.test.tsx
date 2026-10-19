// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/bets", () => ({
  acceptBetAction: vi.fn(),
  declineBetAction: vi.fn(),
  iLostAction: vi.fn(),
}));

import { BetSlip } from "@/components/BetSlip";
import { STRINGS } from "@/lib/content/strings";
import type { Bet } from "@/lib/db/schema";
import { render } from "./members-wrapper";

const bet = (over: Partial<Bet> = {}): Bet => ({
  id: 1,
  seasonId: 1,
  proposer: "alex",
  opponent: "sam",
  claim: "it rains on day 9",
  stakes: "coffee",
  status: "proposed",
  loser: null,
  receiptPostId: null,
  settledDay: null,
  createdAt: new Date(),
  ...over,
});

const slip = (me: string) => <BetSlip bets={[bet()]} me={me} skins={[]} initialSkinId={null} />;

describe("BetSlip with three members", () => {
  it("names the proposer against the chosen opponent, not whoever is left over", () => {
    render(slip("alex"));
    expect(screen.getByText("Alex v Sam")).toBeInTheDocument();
  });

  it("follows the stored opponent when it is the third member", () => {
    const { unmount } = render(
      <BetSlip bets={[bet({ opponent: "jo" })]} me="jo" skins={[]} initialSkinId={null} />,
    );
    expect(screen.getByText("Alex v Jo")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bets.accept)).toBeInTheDocument();
    unmount();
    render(<BetSlip bets={[bet({ opponent: "jo" })]} me="sam" skins={[]} initialSkinId={null} />);
    expect(screen.queryByText(STRINGS.bets.accept)).toBeNull();
  });

  it("offers accept and decline to the opponent only", () => {
    render(slip("sam"));
    expect(screen.getByText(STRINGS.bets.accept)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bets.decline)).toBeInTheDocument();
  });

  it("offers nothing to the proposer or to the third member", () => {
    const { unmount } = render(slip("alex"));
    expect(screen.queryByText(STRINGS.bets.accept)).toBeNull();
    unmount();
    render(slip("jo"));
    expect(screen.queryByText(STRINGS.bets.accept)).toBeNull();
    expect(screen.queryByText(STRINGS.bets.decline)).toBeNull();
  });
});
