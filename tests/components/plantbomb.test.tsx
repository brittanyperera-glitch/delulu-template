// @vitest-environment jsdom
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/bombs", () => ({ armBombAction: vi.fn(async () => undefined) }));

import { armBombAction } from "@/actions/bombs";
import { PlantBomb } from "@/components/PlantBomb";
import { STRINGS } from "@/lib/content/strings";
import { skinRow } from "../factories";
import { render } from "./members-wrapper";

const skins = [skinRow()];

describe("PlantBomb", () => {
  it("shows the arm form on day 99, one day before the finale", () => {
    render(<PlantBomb skins={[]} initialSkinId={null} day={99} sender="alex" />);
    fireEvent.click(screen.getByText(STRINGS.bombs.cta));
    expect(screen.getByPlaceholderText(STRINGS.bombs.note)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.bombs.arm)).toBeInTheDocument();
  });

  it("shows NO TIME LEFT instead of an impossible form on day 100", () => {
    render(<PlantBomb skins={[]} initialSkinId={null} day={100} sender="alex" />);
    fireEvent.click(screen.getByText(STRINGS.bombs.cta));
    expect(screen.getByText(STRINGS.bombs.noTime)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(STRINGS.bombs.note)).toBeNull();
    expect(screen.queryByText(STRINGS.bombs.arm)).toBeNull();
  });

  it("lists the other two members as recipients and never the sender", async () => {
    render(<PlantBomb skins={skins} initialSkinId={1} day={3} sender="alex" />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.cta }));
    const group = within(screen.getByRole("radiogroup", { name: STRINGS.bombs.to }));
    expect(group.getAllByRole("button").map((b) => b.textContent)).toEqual(["Sam", "Jo"]);
    await userEvent.click(group.getByRole("button", { name: "Jo" }));
    await userEvent.type(screen.getByPlaceholderText(STRINGS.bombs.note), "for jo");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.arm }));
    expect(armBombAction).toHaveBeenCalledWith(expect.objectContaining({ recipient: "jo" }));
  });

  it("arms a day trigger, which is the default choice", async () => {
    render(<PlantBomb skins={skins} initialSkinId={1} day={3} sender="alex" />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.cta }));
    await userEvent.type(screen.getByPlaceholderText(STRINGS.bombs.note), "look up");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.arm }));
    expect(armBombAction).toHaveBeenCalledWith({
      recipient: "sam",
      body: "look up",
      skinId: 1,
      trigger: { kind: "day", detonateDay: 4 },
    });
  });

  it("arms a count trigger for the stamp and target chosen in the UI", async () => {
    render(<PlantBomb skins={skins} initialSkinId={1} day={3} sender="alex" />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.cta }));
    await userEvent.type(screen.getByPlaceholderText(STRINGS.bombs.note), "hit your number");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.whenReaches("Sam") }));
    // getByLabelText is ambiguous here: the number input and the stamp radiogroup share the
    // same aria-label. "spinbutton" is the number input's implicit role, so it is unique.
    const target = screen.getByRole("spinbutton", { name: STRINGS.bombs.whenReaches("Sam") });
    await userEvent.clear(target);
    await userEvent.type(target, "7");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.stamps.L }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.arm }));
    expect(armBombAction).toHaveBeenCalledWith({
      recipient: "sam",
      body: "hit your number",
      skinId: 1,
      trigger: { kind: "count", stamp: "L", target: 7 },
    });
  });

  it("arms an event trigger for the event chosen in the UI", async () => {
    render(<PlantBomb skins={skins} initialSkinId={1} day={3} sender="alex" />);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.cta }));
    await userEvent.type(screen.getByPlaceholderText(STRINGS.bombs.note), "surprise");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.nextTime("Sam") }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.events.dare_dealt }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.bombs.arm }));
    expect(armBombAction).toHaveBeenCalledWith({
      recipient: "sam",
      body: "surprise",
      skinId: 1,
      trigger: { kind: "event", event: "dare_dealt" },
    });
  });
});
