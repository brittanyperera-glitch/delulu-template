// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/tracks", () => ({
  approveTrackAction: vi.fn(() => new Promise(() => {})),
  addTrackCommentAction: vi.fn(() => new Promise(() => {})),
  addTrackAction: vi.fn(() => new Promise(() => {})),
}));

import { SoundtrackRoom } from "@/components/SoundtrackRoom";
import { STRINGS } from "@/lib/content/strings";
import { trackRow } from "../factories";
import { render } from "./members-wrapper";

const approvedTrack = trackRow({ id: 10, title: "Made the cut", approvedAt: new Date() });
const pendingTrack = trackRow({ id: 20, author: "sam", title: "Still waiting" });
const props = {
  approved: [approvedTrack],
  allTracks: [approvedTrack, pendingTrack],
  me: "alex" as const,
  skins: [],
  initialSkinId: null,
};

describe("SoundtrackRoom", () => {
  it("opens on the Mixtape tab and turns the whole page dark", () => {
    const { container } = render(<SoundtrackRoom {...props} />);
    // Every track shows in the mixtape, approved ones included.
    expect(screen.getByText("Still waiting")).toBeInTheDocument();
    expect(screen.getByText("Made the cut")).toBeInTheDocument();
    // The whole-page wrapper carries the dark theme, not just the list box.
    expect((container.firstChild as HTMLElement).className).toContain("bg-mixtape-bg");
  });

  it("switches to the Soundtrack tab: rust theme, only the approved record", async () => {
    const { container } = render(<SoundtrackRoom {...props} />);
    await userEvent.click(screen.getByRole("tab", { name: /The Soundtrack/ }));
    expect((container.firstChild as HTMLElement).className).toContain("bg-rust");
    expect(screen.getByText("Made the cut")).toBeInTheDocument();
    // "Still waiting" is pending, so it only lives on the Mixtape, not the vinyl shelf.
    expect(screen.queryByText("Still waiting")).not.toBeInTheDocument();
  });

  it("counts all tracks on the Mixtape tab and only approved on the Soundtrack tab", () => {
    render(<SoundtrackRoom {...props} />);
    expect(screen.getByRole("tab", { name: /The Mixtape 2/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /The Soundtrack 1/ })).toBeInTheDocument();
  });

  it("marks an approved track on the Mixtape with the green bar and no thumbs-up", () => {
    render(<SoundtrackRoom {...props} />);
    const approvedRow = screen.getByText("Made the cut").closest("li");
    expect(approvedRow?.className).toContain("border-l-spotify");
    // Pending track (the other person's) keeps its promote button; the approved one does not.
    const approveButtons = screen.getAllByRole("button", { name: "Onto the record" });
    expect(approveButtons).toHaveLength(1);
  });

  // This room forks the shared SectionPage to theme itself, so it must keep SectionPage's two
  // guarantees itself: a way back to the wall (the "i cant get back to the wall" incident) and
  // the room's help. Both tabs, since the shell is above the tab panel.
  it("keeps the way back to the wall and the room help, on either tab", async () => {
    render(<SoundtrackRoom {...props} />);
    expect(screen.getByRole("link", { name: STRINGS.wall.wall })).toHaveAttribute("href", "/");
    expect(screen.getByLabelText(STRINGS.help.label)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /The Soundtrack/ }));
    expect(screen.getByRole("link", { name: STRINGS.wall.wall })).toHaveAttribute("href", "/");
  });
});
