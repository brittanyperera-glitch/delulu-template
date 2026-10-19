// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManifestoEditor } from "@/components/ManifestoEditor";

describe("ManifestoEditor", () => {
  it("offers Edit when today's edit is not spent", () => {
    render(<ManifestoEditor body="So back." spent={false} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("shows the spent line instead of Edit once today's edit is used", () => {
    render(<ManifestoEditor body="So back." spent={true} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByText("That's your edit for today.")).toBeInTheDocument();
  });
});
