// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

describe("ui primitives", () => {
  it("Pill renders uppercase sticker text in its tone", () => {
    render(<Pill tone="mustard">first</Pill>);
    const pill = screen.getByText("first");
    expect(pill.className).toContain("bg-mustard");
    expect(pill.className).toContain("uppercase");
  });

  it("Card applies a tilt as a rotate transform", () => {
    render(<Card tilt={-2}>hello</Card>);
    expect(screen.getByText("hello").style.transform).toBe("rotate(-2deg)");
  });

  // The paper system lets a skin choose a dark paper, so the ink has to come with it.
  // Brown text on rust is unreadable and nothing else would catch it.
  it("Card dark papers carry their own cream ink", () => {
    render(<Card tone="rust">rusty</Card>);
    expect(screen.getByText("rusty").className).toContain("bg-rust");
    expect(screen.getByText("rusty").className).toContain("text-cream");
  });

  it("Card light papers leave the ink alone", () => {
    render(<Card tone="mustard">sunny</Card>);
    expect(screen.getByText("sunny").className).toContain("bg-mustard");
    expect(screen.getByText("sunny").className).not.toContain("text-cream");
  });

  it("Button primary is brown on cream and 48px tall", () => {
    render(<Button kind="primary">Post</Button>);
    const b = screen.getByRole("button", { name: "Post" });
    expect(b.className).toContain("bg-brown");
    expect(b.className).toContain("h-12");
  });
});
