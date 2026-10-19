// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NewSkinLauncher } from "@/components/NewSkinLauncher";

describe("NewSkinLauncher", () => {
  it("gives the launcher trigger a different accessible name from the sheet's submit", async () => {
    render(<NewSkinLauncher />);
    const trigger = screen.getByRole("button", { name: "New skin" });
    await userEvent.click(trigger);
    // Sheet is open: its own "Add skin" submit is now in the DOM alongside the trigger.
    expect(screen.getByRole("button", { name: "Add skin" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "New skin" })).toHaveLength(1);
  });
});
