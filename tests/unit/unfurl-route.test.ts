import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getPlayerOrNull: async () => "ana" }));
const { unfurl } = vi.hoisted(() => ({
  unfurl: vi.fn(async (url: string) => ({ url, title: "t" })),
}));
vi.mock("@/lib/unfurl", () => ({ unfurl }));

import { GET } from "@/app/api/unfurl/route";

const req = () => new Request("http://x/api/unfurl?url=https%3A%2F%2Fexample.com");

afterEach(() => {
  vi.unstubAllEnvs();
  unfurl.mockClear();
});

describe("GET /api/unfurl", () => {
  it("is switched off in the demo and never fetches", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    const res = await GET(req());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Link previews are switched off in the demo." });
    expect(unfurl).not.toHaveBeenCalled();
  });

  it("unfurls outside the demo", async () => {
    vi.stubEnv("DEMO_MODE", "");
    expect((await GET(req())).status).toBe(200);
    expect(unfurl).toHaveBeenCalledOnce();
  });
});
