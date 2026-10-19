import { describe, expect, it } from "vitest";
import { isNeonUrl } from "@/lib/db/client";

describe("driver selection", () => {
  it("uses the Neon driver only for Neon and Vercel hosts", () => {
    expect(isNeonUrl("postgres://u:p@ep-cool-name-123.eu-central-1.aws.neon.tech/db")).toBe(true);
    expect(isNeonUrl("postgres://u:p@some-store.vercel-storage.com/db")).toBe(true);
    expect(isNeonUrl("postgres://postgres:x@127.0.0.1:5433/delulu")).toBe(false);
    expect(isNeonUrl("postgres://postgres:x@localhost:5432/delulu")).toBe(false);
    expect(isNeonUrl("not a url")).toBe(false);
  });
});
