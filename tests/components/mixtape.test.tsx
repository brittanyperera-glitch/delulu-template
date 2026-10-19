// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/tracks", () => ({
  approveTrackAction: vi.fn(() => new Promise(() => {})), // never resolves: pending stays true
  addTrackCommentAction: vi.fn(() => new Promise(() => {})),
}));

import { approveTrackAction } from "@/actions/tracks";
import { Mixtape } from "@/components/Mixtape";
import { STRINGS } from "@/lib/content/strings";
import { trackRow } from "../factories";
import { render } from "./members-wrapper";

describe("Mixtape", () => {
  it("shows the thumbs-up for the other person's row and hides it for your own", () => {
    render(
      <Mixtape tracks={[trackRow({ id: 1, author: "sam", title: "Their pick" })]} me="alex" />,
    );
    expect(screen.getByRole("button", { name: STRINGS.soundtrack.approve })).toBeInTheDocument();
  });

  it("shows a quiet waiting line instead of a button on your own suggestion", () => {
    render(<Mixtape tracks={[trackRow({ id: 1, author: "alex", title: "My pick" })]} me="alex" />);
    expect(
      screen.queryByRole("button", { name: STRINGS.soundtrack.approve }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(STRINGS.wall.waitingOn(["Sam", "Jo"]))).toBeInTheDocument();
  });

  it("calls approveTrackAction with the track id when the other person taps it", async () => {
    render(
      <Mixtape tracks={[trackRow({ id: 42, author: "sam", title: "Their pick" })]} me="alex" />,
    );
    await userEvent.click(screen.getByRole("button", { name: STRINGS.soundtrack.approve }));
    expect(approveTrackAction).toHaveBeenCalledWith(42);
  });

  it("flips the cover to reveal the comment thread", async () => {
    render(
      <Mixtape tracks={[trackRow({ id: 1, author: "sam", title: "Their pick" })]} me="alex" />,
    );
    // The comment composer lives behind the flip, so it is absent until the cover is tapped.
    expect(
      screen.queryByPlaceholderText(STRINGS.trackComments.placeholder),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.soundtrack.flipCover }));
    expect(screen.getByPlaceholderText(STRINGS.trackComments.placeholder)).toBeInTheDocument();
  });

  it("shows the quiet empty line when there are no tracks", () => {
    render(<Mixtape tracks={[]} me="alex" />);
    expect(screen.getByText(STRINGS.soundtrack.noTracks)).toBeInTheDocument();
  });

  it("marks an approved track with the green bar and no thumbs-up", () => {
    render(
      <Mixtape
        tracks={[trackRow({ id: 1, author: "sam", title: "Made it", approvedAt: new Date() })]}
        me="alex"
      />,
    );
    expect(screen.getByText("Made it").closest("li")?.className).toContain("border-l-spotify");
    expect(
      screen.queryByRole("button", { name: STRINGS.soundtrack.approve }),
    ).not.toBeInTheDocument();
  });
});
