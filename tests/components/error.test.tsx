// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
// Aliased on import: the default export is itself named `Error`, which would
// otherwise shadow the global `Error` constructor used below.
import ErrorBoundary from "@/app/error";
import { STRINGS } from "@/lib/content/strings";

describe("Error boundary", () => {
  it("shows our own copy and calls reset on click", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);
    expect(screen.getByText(STRINGS.error.title)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.error.blurb)).toBeInTheDocument();
    fireEvent.click(screen.getByText(STRINGS.error.cta));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
