// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/day-context", () => ({
  dayContext: async () => ({ player: "alex" as const, season: { id: 1 }, day: 5, rollover: null }),
}));
vi.mock("@/lib/db/client", () => ({ db: () => ({}) }));
vi.mock("@/lib/repo/jar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repo/jar")>();
  return {
    ...actual,
    countsBySize: vi.fn(async () => ({ tiny: 0, tonight: 0, weekend: 0, planning: 0, feral: 0 })),
    drawnFor: async () => null,
  };
});
vi.mock("@/lib/repo/skins", () => ({ listSkins: async () => [] }));
vi.mock("@/lib/repo/section-post", () => ({ defaultSkinId: async () => null }));

import JarPage from "@/app/jar/page";
import { STRINGS } from "@/lib/content/strings";
import { render } from "./members-wrapper";

describe("JarPage", () => {
  it("says the jar is empty when nothing is in it and nothing is drawn", async () => {
    render(await JarPage());
    expect(screen.getByText(STRINGS.jar.none)).toBeInTheDocument();
  });

  it("still shows the glass and draw buttons once a size has a quest", async () => {
    const jar = await import("@/lib/repo/jar");
    vi.mocked(jar.countsBySize).mockResolvedValueOnce({
      tiny: 1,
      tonight: 0,
      weekend: 0,
      planning: 0,
      feral: 0,
    });
    render(await JarPage());
    expect(screen.queryByText(STRINGS.jar.none)).toBeNull();
    expect(screen.getByText(STRINGS.jar.draw)).toBeInTheDocument();
  });
});
