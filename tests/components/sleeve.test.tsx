// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Sleeve } from "@/components/Sleeve";
import { STRINGS } from "@/lib/content/strings";
import { trackRow } from "../factories";
import { render } from "./members-wrapper";

describe("Sleeve", () => {
  it("clips the decorative disc to its own frame instead of leaking past it", () => {
    const { container } = render(<Sleeve tracks={[]} me="alex" />);
    const disc = container.querySelector(".border-brown.bg-brown");
    const frame = disc?.parentElement;
    // jsdom does no real layout, so this cannot measure the actual pixel overflow (that needs a
    // real browser at 1680/1440/1280/1024, per the rule-45 protocol). What it CAN assert: the
    // disc's frame clips its own box, which is the only fix that cannot fail at any viewport width
    // (a translate distance tuned to fit one width just moves the failure to another).
    expect(frame?.className).toMatch(/overflow-hidden|overflow-clip/);
  });

  it("shows the quiet line when nothing has been approved yet, with no flip controls", () => {
    render(<Sleeve tracks={[]} me="alex" />);
    expect(screen.getByText(STRINGS.soundtrack.noneApproved)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: STRINGS.soundtrack.flipNext }),
    ).not.toBeInTheDocument();
  });

  it("hides the flip controls with only one approved track", () => {
    render(<Sleeve tracks={[trackRow({ id: 1, title: "Only One" })]} me="alex" />);
    expect(screen.getByText("Only One")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: STRINGS.soundtrack.flipNext }),
    ).not.toBeInTheDocument();
  });

  it("flips to the next and previous record by button", async () => {
    render(
      <Sleeve
        tracks={[
          trackRow({ id: 1, title: "First Track" }),
          trackRow({ id: 2, title: "Second Track" }),
        ]}
        me="alex"
      />,
    );
    expect(screen.getByText("First Track")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.soundtrack.position(1, 2))).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.soundtrack.flipNext }));
    expect(screen.getByText("Second Track")).toBeInTheDocument();
    expect(screen.getByText(STRINGS.soundtrack.position(2, 2))).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.soundtrack.flipPrev }));
    expect(screen.getByText("First Track")).toBeInTheDocument();
  });

  it("flips to the next record on the right arrow key", () => {
    render(
      <Sleeve
        tracks={[
          trackRow({ id: 1, title: "First Track" }),
          trackRow({ id: 2, title: "Second Track" }),
        ]}
        me="alex"
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Second Track")).toBeInTheDocument();
  });
});
