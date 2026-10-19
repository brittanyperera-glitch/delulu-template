// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WaitingOn } from "@/components/WaitingOn";
import { STRINGS } from "@/lib/content/strings";
import { TEST_MEMBERS_MAP } from "../factories";

describe("WaitingOn with three members", () => {
  it("names both people being waited on in one joined line", () => {
    render(
      <WaitingOn
        members={TEST_MEMBERS_MAP}
        waits={[
          { kind: "truth", count: 1, who: ["sam", "jo"] },
          { kind: "dare", count: 2, who: ["sam"] },
        ]}
      />,
    );
    expect(screen.getByText("waiting on Sam and Jo")).toBeInTheDocument();
    expect(screen.getByText(/Dare \(2\)/)).toBeInTheDocument();
  });

  it("names a single person without a conjunction", () => {
    render(
      <WaitingOn members={TEST_MEMBERS_MAP} waits={[{ kind: "bet", count: 1, who: ["jo"] }]} />,
    );
    expect(screen.getByText(STRINGS.wall.waitingOn(["Jo"]))).toBeInTheDocument();
  });

  it("renders nothing when nothing is stalled", () => {
    const { container } = render(<WaitingOn members={TEST_MEMBERS_MAP} waits={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
