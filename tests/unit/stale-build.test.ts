// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { isStaleBuildError, recoverFromStaleBuild } from "@/lib/stale-build";

const chunkError = { name: "ChunkLoadError", message: "Loading chunk 42 failed." };
const genericError = { name: "TypeError", message: "x is not a function" };

let reload: Mock<() => void>;

beforeEach(() => {
  sessionStorage.clear();
  reload = vi.fn<() => void>();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isStaleBuildError", () => {
  it("recognises the ways a stale build fails to load code", () => {
    expect(isStaleBuildError({ name: "ChunkLoadError", message: "" })).toBe(true);
    expect(isStaleBuildError({ name: "Error", message: "Loading chunk 3 failed" })).toBe(true);
    expect(isStaleBuildError({ name: "Error", message: "Loading CSS chunk 7 failed" })).toBe(true);
    expect(
      isStaleBuildError({
        name: "TypeError",
        message: "Failed to fetch dynamically imported module: https://x/y.js",
      }),
    ).toBe(true);
    expect(
      isStaleBuildError({ name: "Error", message: "error loading dynamically imported module" }),
    ).toBe(true);
    // Safari's wording, and it is the browser the bug actually appeared on.
    expect(
      isStaleBuildError({ name: "TypeError", message: "Importing a module script failed." }),
    ).toBe(true);
  });

  it("leaves ordinary bugs alone", () => {
    expect(isStaleBuildError(genericError)).toBe(false);
    expect(isStaleBuildError({ name: "Error", message: "" })).toBe(false);
  });
});

describe("recoverFromStaleBuild", () => {
  it("reloads once to pull the fresh build on a chunk error", () => {
    expect(recoverFromStaleBuild(chunkError, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload on an ordinary error", () => {
    expect(recoverFromStaleBuild(genericError, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads at most once per tab, no matter how many times it is called", () => {
    // The reload that fixes it never re-enters here; if it does not fix it, the page keeps
    // throwing, and this must not loop. The guard is a count, so it holds regardless of how long
    // any single reload takes.
    for (let i = 0; i < 5; i++) recoverFromStaleBuild(chunkError, reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("uses window.location.reload by default when no reload is injected", () => {
    const original = window.location;
    const locationReload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: locationReload },
    });
    try {
      expect(recoverFromStaleBuild(chunkError)).toBe(true);
      expect(locationReload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("does nothing when storage is unavailable, rather than risk a loop", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(recoverFromStaleBuild(chunkError, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
