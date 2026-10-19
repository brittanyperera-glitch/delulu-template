import { describe, expect, it } from "vitest";
import { shouldMigrate } from "../../scripts/build.mjs";

describe("shouldMigrate", () => {
  it("skips migrations on preview deployments", () => {
    expect(shouldMigrate({ VERCEL_ENV: "preview" })).toBe(false);
  });

  it.each([{ VERCEL_ENV: "production" }, {}, { VERCEL_ENV: "development" }])(
    "migrates for %j",
    (env) => {
      expect(shouldMigrate(env)).toBe(true);
    },
  );
});
