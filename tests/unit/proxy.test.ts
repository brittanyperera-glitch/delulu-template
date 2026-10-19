import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Any database access from the proxy fails the test: public requests must not need it.
vi.mock("@/lib/db/client", () => ({
  db: () => {
    throw new Error("proxy touched the database");
  },
}));

import { proxy } from "@/proxy";

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined);

describe("proxy without a player cookie", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "test-secret-test-secret-test-1234");
    vi.stubEnv("GROUP_CODE", "test-passcode-for-the-gate");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("serves the public about page without a database read", async () => {
    const res = await proxy(req("/about"));
    expect(res.status).toBe(200);
  });

  it("redirects an app route to the gate without a database read", async () => {
    const res = await proxy(req("/bets"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/gate");
  });

  it("redirects an app route to /about on a demo deployment", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    const res = await proxy(req("/bets"));
    expect(res.headers.get("location")).toBe("http://localhost/about");
  });

  it("answers 404 for /demo-code on a non-demo deployment, before any page streams", async () => {
    const res = await proxy(req("/demo-code"));
    expect(res.status).toBe(404);
  });

  it("lets /demo-code through on a demo deployment", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    const res = await proxy(req("/demo-code"));
    expect(res.status).toBe(200);
  });
});
