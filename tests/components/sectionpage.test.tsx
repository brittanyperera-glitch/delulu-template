// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { ROOMS } from "@/lib/rooms";
import { render } from "./members-wrapper";

describe("SectionPage", () => {
  // The defect this guards: the thirteen-pill nav had the Wall as its FIRST item, and the
  // drawer that replaced it lists only the other nine rooms. it was found by using the
  // app: "i cant get back to the wall".
  it("always offers a way back to the wall", () => {
    render(
      <SectionPage title="Manifesto" slug="manifesto">
        <p>body</p>
      </SectionPage>,
    );
    const home = screen.getByRole("link", { name: STRINGS.wall.wall });
    expect(home).toHaveAttribute("href", "/");
  });

  it("offers a way back from every room, not just one", () => {
    for (const room of ROOMS) {
      const { unmount } = render(
        <SectionPage title={room.label} slug={room.slug}>
          <p>body</p>
        </SectionPage>,
      );
      expect(screen.getByRole("link", { name: STRINGS.wall.wall }), room.slug).toHaveAttribute(
        "href",
        "/",
      );
      unmount();
    }
  });

  it("explains what the room is for, behind a question mark", async () => {
    render(
      <SectionPage title="Prophecies" slug="prophecies">
        <p>body</p>
      </SectionPage>,
    );
    const help = screen.getByLabelText(STRINGS.help.label);
    // Collapsed by default, so it never becomes furniture on a room you already know.
    expect(screen.getByText(STRINGS.help.prophecies)).not.toBeVisible();
    await userEvent.click(help);
    expect(screen.getByText(STRINGS.help.prophecies)).toBeVisible();
  });

  it("has help copy for every registered room", () => {
    for (const room of ROOMS) {
      expect(STRINGS.help[room.slug], room.slug).toBeTruthy();
    }
  });
});
