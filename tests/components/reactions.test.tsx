// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/reactions", () => ({
  toggleReactionAction: vi.fn(() => new Promise(() => {})), // never resolves: pending stays true
}));

import { Reactions } from "@/components/Reactions";
import { render } from "./members-wrapper";

describe("Reactions", () => {
  it("disables the pill while its toggle is in flight, so a double tap cannot fire twice", async () => {
    render(<Reactions postId={1} reactions={[]} me="alex" />);
    const button = screen.getAllByRole("button")[0];
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(button).toBeDisabled();
  });
});
