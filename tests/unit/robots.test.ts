import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  it("allows only /about and disallows everything else", () => {
    const rule = robots().rules;
    const r = Array.isArray(rule) ? rule[0] : rule;
    expect(r.allow).toBe("/about");
    expect(r.disallow).toBe("/");
  });
});
