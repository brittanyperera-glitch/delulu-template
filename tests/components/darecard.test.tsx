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

import { DareCard } from "@/components/DareCard";
import { STRINGS } from "@/lib/content/strings";
import { render } from "./members-wrapper";

const dare = (over: Partial<Parameters<typeof DareCard>[0]["dare"]> = {}) => ({
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

const tiltOf = (container: HTMLElement) =>
  (container.firstElementChild as HTMLElement).style.transform;

describe("DareCard", () => {
  it("renders one dare with no list around it, dealt face down and flipped on tap", async () => {
    const { container } = render(
      <DareCard dare={dare()} me="sam" skins={[]} initialSkinId={null} />,
    );
    expect(container.querySelector("ul, li")).toBeNull();
    expect(screen.queryByText("sing in the street")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.dares.reveal }));
    expect(screen.getByText("sing in the street")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.dares.accept })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.dares.negotiate })).toBeInTheDocument();
  });

  it("tilts by dare id, so two cards rendered alone do not sit at the same angle", () => {
    const a = render(<DareCard dare={dare({ id: 1 })} me="alex" skins={[]} initialSkinId={null} />);
    const b = render(<DareCard dare={dare({ id: 2 })} me="alex" skins={[]} initialSkinId={null} />);
    expect(tiltOf(a.container)).not.toBe("");
    expect(tiltOf(a.container)).not.toBe(tiltOf(b.container));
  });

  it("disables its own buttons while its action is in flight", async () => {
    render(<DareCard dare={dare()} me="sam" skins={[]} initialSkinId={null} />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.dares.reveal }));
    const accept = screen.getByRole("button", { name: STRINGS.dares.accept });
    expect(accept).toBeEnabled();
    await userEvent.click(accept);
    expect(accept).toBeDisabled();
    expect(screen.getByRole("button", { name: STRINGS.dares.chicken })).toBeDisabled();
  });
});
