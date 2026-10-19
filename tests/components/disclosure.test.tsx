// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Disclosure } from "@/components/ui/Disclosure";

describe("Disclosure", () => {
  // The headline is the contract: a collapsed row must still carry its value, or you cannot
  // tell whether opening it is worth a tap.
  it("shows the headline while collapsed and hides the body", () => {
    render(
      <Disclosure headline={<span>Truth, day 6</span>}>
        <p>the answer form</p>
      </Disclosure>,
    );
    expect(screen.getByText("Truth, day 6")).toBeVisible();
    expect(screen.getByText("the answer form")).not.toBeVisible();
  });

  it("reveals the body when the headline is clicked", async () => {
    render(
      <Disclosure headline={<span>Truth, day 6</span>}>
        <p>the answer form</p>
      </Disclosure>,
    );
    await userEvent.click(screen.getByText("Truth, day 6"));
    expect(screen.getByText("the answer form")).toBeVisible();
  });

  it("can start open", () => {
    render(
      <Disclosure open headline={<span>Truth, day 6</span>}>
        <p>the answer form</p>
      </Disclosure>,
    );
    expect(screen.getByText("the answer form")).toBeVisible();
  });
});
