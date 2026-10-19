import { describe, expect, it } from "vitest";
import { kindFor, MAX_SECONDS, validateMedia } from "@/lib/upload";

describe("media rules", () => {
  it("maps content types to kinds", () => {
    expect(kindFor("image/jpeg")).toBe("photo");
    expect(kindFor("audio/webm")).toBe("voice");
    expect(kindFor("video/quicktime")).toBe("video");
    expect(kindFor("application/pdf")).toBeNull();
  });
  it("caps voice at 180 seconds and video at 60", () => {
    expect(MAX_SECONDS.voice).toBe(180);
    expect(MAX_SECONDS.video).toBe(60);
    expect(validateMedia("voice", "audio/webm", 179)).toBeNull();
    expect(validateMedia("voice", "audio/webm", 181)).toMatch(/3 minutes/);
    expect(validateMedia("video", "video/mp4", 61)).toMatch(/60 seconds/);
  });
  it("rejects a type that does not match the kind", () => {
    expect(validateMedia("photo", "video/mp4")).toMatch(/photo/i);
  });
});
