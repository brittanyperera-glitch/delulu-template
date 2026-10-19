// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stale-build", () => ({ recoverFromStaleBuild: vi.fn() }));

import ErrorBoundary from "@/app/error";
import { STRINGS } from "@/lib/content/strings";
import { recoverFromStaleBuild } from "@/lib/stale-build";

const recover = vi.mocked(recoverFromStaleBuild);

afterEach(() => {
  recover.mockReset();
});

describe("ErrorBoundary", () => {
  it("hands the thrown error to stale-build recovery on mount", () => {
    const error = Object.assign(new Error("Loading chunk 5 failed"), { name: "ChunkLoadError" });
    render(<ErrorBoundary error={error} reset={() => {}} />);
    expect(recover).toHaveBeenCalledWith(error);
  });

  it("still shows the message, so an ordinary error is never a blank screen", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByText(STRINGS.error.title)).toBeInTheDocument();
    expect(screen.getByText(STRINGS.error.blurb)).toBeInTheDocument();
  });
});
