import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { handleUpload } = vi.hoisted(() => ({
  handleUpload: vi.fn(async (_opts: unknown) => ({
    type: "blob.generate-client-token",
    clientToken: "t",
  })),
}));
vi.mock("@vercel/blob/client", () => ({ handleUpload }));
let player: string | null = "alex";
vi.mock("@/lib/session", () => ({ getPlayerOrNull: async () => player }));

import { POST } from "@/app/api/upload/route";

const req = () =>
  new Request("http://x/api/upload", {
    method: "POST",
    body: JSON.stringify({ type: "blob.generate-client-token", payload: {} }),
  });

beforeEach(() => {
  handleUpload.mockClear();
  player = "alex";
});
afterEach(() => vi.unstubAllEnvs());

describe("upload route in demo mode", () => {
  it("returns 403 before any Blob call or token check", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
    const res = await POST(req());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Uploads are switched off in the demo." });
    expect(handleUpload).not.toHaveBeenCalled();
  });
  it("is unchanged outside demo mode: 401 without a player, Blob call with one", async () => {
    vi.stubEnv("DEMO_MODE", undefined);
    player = null;
    expect((await POST(req())).status).toBe(401);
    player = "alex";
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "tok");
    expect((await POST(req())).status).toBe(200);
    expect(handleUpload).toHaveBeenCalledWith(expect.objectContaining({ token: "tok" }));
  });
  it("no longer reads the doubled token name", async () => {
    vi.stubEnv("DEMO_MODE", undefined);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", undefined);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN", "old");
    await POST(req());
    expect(handleUpload).toHaveBeenCalledWith(expect.objectContaining({ token: undefined }));
  });
});
