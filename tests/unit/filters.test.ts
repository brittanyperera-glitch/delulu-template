import { describe, expect, it } from "vitest";
import { parseFilter } from "@/lib/filters";

describe("parseFilter", () => {
  it("maps slugs to stamps and skins", () => {
    expect(parseFilter("w")).toEqual({ kind: "stamp", stamp: "W" });
    expect(parseFilter("l")).toEqual({ kind: "stamp", stamp: "L" });
    expect(parseFilter("trululu")).toEqual({ kind: "stamp", stamp: "TRULULU" });
    expect(parseFilter("skin-12")).toEqual({ kind: "skin", id: 12 });
    expect(parseFilter("skin-x")).toBeNull();
    expect(parseFilter("nope")).toBeNull();
  });
});
