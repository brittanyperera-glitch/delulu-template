// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "@/components/ui/Sheet";

describe("Sheet", () => {
  it("renders nothing when closed", () => {
    render(
      <Sheet open={false} onClose={() => {}}>
        <p>inside</p>
      </Sheet>,
    );
    expect(screen.queryByText("inside")).toBeNull();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose}>
        <p>inside</p>
      </Sheet>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not listen for Escape while closed", async () => {
    const onClose = vi.fn();
    render(
      <Sheet open={false} onClose={onClose}>
        <p>inside</p>
      </Sheet>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("names the dialog from its title", () => {
    render(
      <Sheet open onClose={() => {}} title="The rooms">
        <p>inside</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "The rooms" })).toBeInTheDocument();
  });

  // The twelve existing call sites pass their own heading, so a titleless sheet must not
  // claim an accessible name it does not have.
  it("sets no aria-labelledby without a title", () => {
    render(
      <Sheet open onClose={() => {}}>
        <p>inside</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-labelledby");
  });
});
