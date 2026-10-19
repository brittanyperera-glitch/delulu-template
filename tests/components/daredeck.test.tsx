// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/dares", () => ({
  acceptDareAction: vi.fn(() => new Promise(() => {})), // never resolves: pending stays true
  chickenOutAction: vi.fn(() => new Promise(() => {})),
  doneDareAction: vi.fn(() => new Promise(() => {})),
  resolveNegotiationAction: vi.fn(() => new Promise(() => {})),
  negotiateAction: vi.fn(() => new Promise(() => {})),
}));

import { DareDeck } from "@/components/DareDeck";
import { render } from "./members-wrapper";

const dare = (over: Partial<Parameters<typeof DareDeck>[0]["dares"][number]> = {}) => ({
  id: 1,
  seasonId: 1,
  darer: "alex" as const,
  dared: "sam" as const,
  body: "sing in the street",
  stake: null,
  status: "open" as const,
  counter: null,
  donePostId: null,
  doneDay: null,
  createdAt: new Date(),
  ...over,
});

describe("DareDeck", () => {
  it("deals a new dare face down for the dared person and flips it on tap", async () => {
    render(<DareDeck dares={[dare()]} me="sam" skins={[]} initialSkinId={null} />);
    expect(screen.queryByText("sing in the street")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Flip it" }));
    expect(screen.getByText("sing in the street")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chicken out" })).toBeInTheDocument();
  });

  it("shows the darer their own dare face up with no replies", () => {
    render(<DareDeck dares={[dare()]} me="alex" skins={[]} initialSkinId={null} />);
    expect(screen.getByText("sing in the street")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("leaves the other dare's buttons live while one dare is being answered", async () => {
    render(
      <DareDeck
        dares={[dare({ id: 1 }), dare({ id: 2, body: "eat a lemon" })]}
        me="sam"
        skins={[]}
        initialSkinId={null}
      />,
    );
    await userEvent.click(screen.getAllByRole("button", { name: "Flip it" })[0]);
    await userEvent.click(screen.getAllByRole("button", { name: "Flip it" })[0]);
    const [first, second] = screen.getAllByRole("button", { name: "Accept" });
    await userEvent.click(first);
    expect(first).toBeDisabled();
    expect(second).toBeEnabled();
  });
});
