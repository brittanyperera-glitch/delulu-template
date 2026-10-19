// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/tracks", () => ({
  addTrackCommentAction: vi.fn(() => Promise.resolve()),
}));

import { addTrackCommentAction } from "@/actions/tracks";
import { TrackComments } from "@/components/TrackComments";
import { STRINGS } from "@/lib/content/strings";
import { trackCommentRow } from "../factories";
import { render } from "./members-wrapper";

describe("TrackComments", () => {
  it("shows a top-level comment and its one reply", () => {
    render(
      <TrackComments
        trackId={1}
        me="alex"
        comments={[
          {
            ...trackCommentRow({ id: 1, author: "alex", body: "love this one" }),
            replies: [trackCommentRow({ id: 2, author: "sam", parentId: 1, body: "obsessed" })],
          },
        ]}
      />,
    );
    expect(screen.getByText("love this one")).toBeInTheDocument();
    expect(screen.getByText("obsessed")).toBeInTheDocument();
  });

  it("shows the quiet line when there are no comments yet", () => {
    render(<TrackComments trackId={1} me="alex" comments={[]} />);
    expect(screen.getByText(STRINGS.trackComments.none)).toBeInTheDocument();
  });

  it("submits the add-comment input with no parentId", async () => {
    render(<TrackComments trackId={7} me="alex" comments={[]} />);
    await userEvent.type(
      screen.getByPlaceholderText(STRINGS.trackComments.placeholder),
      "a fresh comment",
    );
    await userEvent.click(screen.getByRole("button", { name: STRINGS.trackComments.send }));
    expect(addTrackCommentAction).toHaveBeenCalledWith(7, "a fresh comment");
  });
});
