import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO_URL, DEPLOY_URL } from "@/components/marketing/links";

describe("marketing links", () => {
  it("DEPLOY_URL is the Deploy button URL in the README", () => {
    const readme = readFileSync("README.md", "utf8");
    const url = readme.match(/https:\/\/vercel\.com\/new\/clone\?[^)\s]+/)?.[0];
    expect(url).toBeDefined();
    expect(DEPLOY_URL).toBe(url);
  });

  it("DEMO_URL points at the demo-code page, not the site root", () => {
    expect(DEMO_URL.endsWith("/demo-code")).toBe(true);
  });
});
