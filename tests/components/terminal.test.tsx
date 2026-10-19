// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Terminal } from "@/components/Terminal";
import type { BombFuse } from "@/lib/repo/bombs";
import { TEST_MEMBERS_MAP } from "../factories";

const dayFuse = (over: Partial<Extract<BombFuse, { kind: "day" }>> = {}): BombFuse => ({
  kind: "day",
  daysLeft: 4,
  percent: 50,
  ...over,
});

const view = (over = {}) => ({
  id: 1,
  sender: "alex" as const,
  recipient: "sam" as const,
  armedDay: 3,
  mine: false,
  detonated: false,
  due: false,
  fuse: dayFuse(),
  body: null as string | null,
  ...over,
});

describe("Terminal", () => {
  it("gives the recipient the countdown and no words", () => {
    render(<Terminal members={TEST_MEMBERS_MAP} views={[view()]} />);
    expect(screen.getByText("PAYLOAD 01")).toBeInTheDocument();
    expect(screen.getByText("D-04")).toBeInTheDocument();
    expect(screen.getByText("EYES ONLY")).toBeInTheDocument();
    expect(screen.getByText("CLASSIFIED")).toBeInTheDocument();
    expect(screen.getByText("1 ARMED")).toBeInTheDocument();
    expect(screen.getByText("NEXT D-4")).toBeInTheDocument();
  });

  it("gives the sender their own words", () => {
    render(<Terminal members={TEST_MEMBERS_MAP} views={[view({ mine: true, body: "look up" })]} />);
    expect(screen.getByText("look up")).toBeInTheDocument();
    expect(screen.queryByText("EYES ONLY")).toBeNull();
  });

  it("shows a detonated bomb as dim and gone, excluded from the armed count", () => {
    render(
      <Terminal
        members={TEST_MEMBERS_MAP}
        views={[view({ detonated: true, body: "look up", mine: true })]}
      />,
    );
    expect(screen.getByText("DETONATED")).toBeInTheDocument();
    expect(screen.getByText("0 ARMED")).toBeInTheDocument();
    expect(screen.queryByText(/NEXT/)).toBeNull();
  });

  it("gives the recipient of a due bomb an open control, excluded from the armed count", () => {
    render(
      <Terminal
        members={TEST_MEMBERS_MAP}
        views={[view({ due: true, fuse: dayFuse({ daysLeft: 0, percent: 100 }) })]}
      />,
    );
    expect(screen.getByText("Open it")).toBeInTheDocument();
    expect(screen.getByText("0 ARMED")).toBeInTheDocument();
  });

  it("tells the sender of a due bomb it is pending, with no open control", () => {
    render(
      <Terminal
        members={TEST_MEMBERS_MAP}
        views={[
          view({
            due: true,
            mine: true,
            body: "look up",
            fuse: dayFuse({ daysLeft: 0, percent: 100 }),
          }),
        ]}
      />,
    );
    expect(screen.getByText("PENDING OPEN")).toBeInTheDocument();
    expect(screen.queryByText("Open it")).toBeNull();
  });

  it("renders a count fuse as have of target with a bar, and an event fuse as waiting with none", () => {
    render(
      <Terminal
        members={TEST_MEMBERS_MAP}
        views={[
          view({
            id: 2,
            fuse: { kind: "count", stamp: "W", have: 1, target: 3, percent: 33 },
          }),
          view({ id: 3, fuse: { kind: "event", event: "jar_add" } }),
        ]}
      />,
    );
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByText("WAITING")).toBeInTheDocument();
  });
});
