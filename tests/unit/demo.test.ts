import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import DemoCodePage from "@/app/demo-code/page";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemo } from "@/lib/demo";

afterEach(() => vi.unstubAllEnvs());

describe("isDemo", () => {
  it("is true only for DEMO_MODE=1", () => {
    vi.stubEnv("DEMO_MODE", "1");
    expect(isDemo()).toBe(true);
    for (const v of ["", "0", "true", "yes"]) {
      vi.stubEnv("DEMO_MODE", v);
      expect(isDemo()).toBe(false);
    }
    vi.stubEnv("DEMO_MODE", undefined);
    expect(isDemo()).toBe(false);
  });
});

describe("demo-code page", () => {
  it("404s when not a demo, even with a code set", async () => {
    vi.stubEnv("GROUP_CODE", "secret-demo-code");
    vi.stubEnv("DEMO_MODE", undefined);
    await expect(DemoCodePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it("shows the code and a link to the gate in demo mode", async () => {
    vi.stubEnv("GROUP_CODE", "secret-demo-code");
    vi.stubEnv("DEMO_MODE", "1");
    const html = renderToStaticMarkup(await DemoCodePage());
    expect(html).toContain("secret-demo-code");
    expect(html).toContain('href="/gate"');
  });
});

describe("DemoBanner", () => {
  it("renders nothing outside demo mode", () => {
    vi.stubEnv("DEMO_MODE", undefined);
    expect(DemoBanner()).toBeNull();
  });
  it("renders the one-line notice in demo mode, in normal flow", () => {
    vi.stubEnv("DEMO_MODE", "1");
    const html = renderToStaticMarkup(DemoBanner());
    expect(html).toContain("Demo data. Uploads are off and everything resets daily.");
    expect(html).not.toMatch(/fixed|absolute|sticky/);
  });
});
