// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Scrap, TickingBombCard } from "@/components/Scrap";
import { STRINGS } from "@/lib/content/strings";
import type { BombView } from "@/lib/repo/bombs";
import { postRow, skinRow, TEST_MEMBERS_MAP } from "../factories";

const skin = skinRow();
const base = postRow({ id: 3 });

describe("Scrap", () => {
  it("renders a text post with author, day and stamps", () => {
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: {
            ...base,
            type: "text" as const,
            body: "not a metaphor",
            stamps: ["W", "TRULULU"],
          },
          skin,
          reactions: [],
          comments: [],
          commentCount: 2,
        }}
      />,
    );
    expect(screen.getByText("not a metaphor")).toBeInTheDocument();
    // Byline now names the skin too, so this asserts the full string rather than the
    // old "skin name is absent" check that predates this feature.
    expect(screen.getByText("Alex · Day 7 · CEO Alex")).toBeInTheDocument();
    expect(screen.getByText("Big Dubs")).toBeInTheDocument();
    // No STRINGS.stamps entry, so this proves the lookup falls back to the stored value.
    expect(screen.getByText("TRULULU")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
  it("shows the skin name in both large and small modes", () => {
    const item = {
      post: { ...base, type: "text" as const, body: "not a metaphor", stamps: [] },
      skin,
      reactions: [],
      comments: [],
      commentCount: 0,
    };
    const { rerender } = render(<Scrap members={TEST_MEMBERS_MAP} item={item} me="alex" />);
    expect(screen.getByText("Alex · Day 7 · CEO Alex")).toBeInTheDocument();
    rerender(<Scrap members={TEST_MEMBERS_MAP} item={item} me="alex" large />);
    expect(screen.getByText("Alex · Day 7 · CEO Alex")).toBeInTheDocument();
  });
  it("truncates a long skin name instead of pushing the stamps off the card", () => {
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: { ...base, type: "text" as const, body: "x", stamps: [] },
          skin: { ...skin, name: "A Very Long Skin Name That Runs On" },
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    const byline = screen.getByText(/Day 7/);
    expect(byline.className).toContain("truncate");
    expect(byline.className).toContain("min-w-0");
  });
  it("renders a link card and a photo", () => {
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: {
            ...base,
            type: "link" as const,
            body: null,
            stamps: [],
            linkMeta: { url: "https://x.y/z", title: "A Track", site: "Spotify" },
          },
          skin,
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    expect(screen.getByText("A Track")).toBeInTheDocument();
    // A plain string matches the whole accessible name, so this cannot match the
    // wrapping Link, whose name concatenates every child.
    expect(screen.queryByRole("link", { name: "A Track" })).toBeNull();
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: {
            ...base,
            id: 4,
            type: "photo" as const,
            body: null,
            stamps: [],
            mediaUrl: "https://b/p.jpg",
          },
          skin,
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("p.jpg"));
  });
  it("seals a time bomb on the wall: no words, a sealed label, and who it is from", () => {
    render(
      <Scrap
        me="sam"
        members={TEST_MEMBERS_MAP}
        item={{
          post: {
            ...base,
            type: "text" as const,
            body: "hey alex i love you",
            stamps: [],
            source: "bomb",
          },
          skin,
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    expect(screen.queryByText("hey alex i love you")).toBeNull();
    expect(screen.getByText(STRINGS.bombs.wallLabel)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bombs.wallFrom("Alex"))).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.bombs.wallSent)).toBeNull();
  });
  it("tells the sender they sent one, still without showing the words", () => {
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: {
            ...base,
            type: "text" as const,
            body: "hey alex i love you",
            stamps: [],
            source: "bomb",
          },
          skin,
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    expect(screen.getByText(STRINGS.bombs.wallSent)).toBeInTheDocument();
    expect(screen.queryByText("hey alex i love you")).toBeNull();
  });
  it("peeks the latest comment only, small, not the whole thread", () => {
    render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: { ...base, id: 11, type: "text" as const, body: "hi", stamps: [] },
          skin,
          reactions: [],
          commentCount: 2,
          comments: [
            { id: 1, postId: 11, author: "sam", body: "first one", createdAt: new Date() },
            {
              id: 2,
              postId: 11,
              author: "alex",
              body: "second and latest",
              createdAt: new Date(),
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/second and latest/)).toBeInTheDocument();
    expect(screen.queryByText(/first one/)).toBeNull();
  });
  it("shows nothing where there is no comment yet", () => {
    const { container } = render(
      <Scrap
        me="alex"
        members={TEST_MEMBERS_MAP}
        item={{
          post: { ...base, id: 12, type: "text" as const, body: "hi", stamps: [] },
          skin,
          reactions: [],
          comments: [],
          commentCount: 0,
        }}
      />,
    );
    expect(container.querySelector("p.text-muted")).toBeNull();
  });
  it("renders a wall voice player whose tap does not navigate", () => {
    // An ancestor onClick standing in for the Link's own: Next's Link attaches exactly this
    // kind of handler to the rendered <a> to intercept the click for client-side routing, so
    // proving it never fires proves the tap never reaches the link, native href included.
    const outerClick = vi.fn();
    const { container } = render(
      // biome-ignore lint/a11y/noStaticElementInteractions: test-only stand-in for Link's own onClick
      // biome-ignore lint/a11y/useKeyWithClickEvents: same
      <div onClick={outerClick}>
        <Scrap
          me="alex"
          members={TEST_MEMBERS_MAP}
          item={{
            post: {
              ...base,
              id: 13,
              type: "voice" as const,
              body: null,
              stamps: [],
              mediaUrl: "https://b/v.webm",
              mediaSeconds: 12,
            },
            skin,
            reactions: [],
            comments: [],
            commentCount: 0,
          }}
        />
      </div>,
    );
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute("src", "https://b/v.webm");
    expect(audio).toHaveAttribute("controls");
    // dispatchEvent (what fireEvent.click wraps) returns false exactly when some handler in
    // the dispatch chain called preventDefault. That is the anchor's own href navigation
    // actually getting cancelled, not just React's synthetic bubbling: stopPropagation alone
    // stops sibling/ancestor listeners, but the anchor's native default action is gated on
    // defaultPrevented regardless of where propagation stopped, so this is the real signal.
    const notCancelled = fireEvent.click(audio as HTMLAudioElement);
    expect(notCancelled).toBe(false);
    expect(outerClick).not.toHaveBeenCalled();
  });
});

describe("TickingBombCard", () => {
  const bomb: BombView = {
    id: 9,
    sender: "sam",
    recipient: "alex",
    armedDay: 1,
    mine: false,
    detonated: false,
    due: false,
    fuse: { kind: "day", daysLeft: 5, percent: 40 },
    body: null,
  };
  it("tells the recipient it is a sealed note from the sender, with the countdown", () => {
    render(<TickingBombCard members={TEST_MEMBERS_MAP} bomb={bomb} />);
    expect(screen.getByText(STRINGS.bombs.wallLabel)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bombs.wallFrom("Sam"))).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bombs.dMinus(5))).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.bombs.wallSent)).toBeNull();
  });
  it("tells the sender they sent one, same as the detonated card", () => {
    render(<TickingBombCard members={TEST_MEMBERS_MAP} bomb={{ ...bomb, mine: true }} />);
    expect(screen.getByText(STRINGS.bombs.wallSent)).toBeInTheDocument();
    expect(screen.queryByText(STRINGS.bombs.wallFrom("Sam"))).toBeNull();
  });
  it("renders a count fuse's tally rather than a day countdown", () => {
    render(
      <TickingBombCard
        members={TEST_MEMBERS_MAP}
        bomb={{
          ...bomb,
          fuse: { kind: "count", stamp: "W", have: 2, target: 5, percent: 40 },
        }}
      />,
    );
    expect(screen.getByText(/2 of 5/)).toBeInTheDocument();
  });
});
