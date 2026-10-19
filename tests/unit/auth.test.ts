import { afterEach, describe, expect, it, vi } from "vitest";
import { GATE_COOKIE, groupPasscode, PLAYER_COOKIE, secret, sign, verify } from "@/lib/auth";
import { isMember, toMembersMap } from "@/lib/members";

const S = "test-secret-with-enough-length-1234";

describe("signed cookie values", () => {
  it("round-trips a value", async () => {
    const token = await sign("alex", S);
    expect(await verify(token, S)).toBe("alex");
  });
  it("rejects a tampered value", async () => {
    const token = await sign("alex", S);
    expect(await verify(token.replace("alex", "sam"), S)).toBeNull();
  });
  it("rejects another secret, an empty token and garbage", async () => {
    const token = await sign("sam", S);
    expect(await verify(token, "another-secret-of-similar-length-99")).toBeNull();
    expect(await verify(undefined, S)).toBeNull();
    expect(await verify("nodot", S)).toBeNull();
  });
});

describe("cookie names", () => {
  it("are neutral, not the original site's", () => {
    expect(PLAYER_COOKIE).toBe("scrapbook_player");
    expect(GATE_COOKIE).toBe("scrapbook_gate");
  });
});

describe("membership", () => {
  const members = toMembersMap([
    { slug: "alex", name: "Alex", colour: "mustard", sortOrder: 0 },
    { slug: "sam", name: "Sam", colour: "sky", sortOrder: 1 },
    { slug: "jo", name: "Jo", colour: "rose", sortOrder: 2 },
  ]);
  it("knows exactly the members in the map, however many", () => {
    expect(isMember(members, "alex")).toBe(true);
    expect(isMember(members, "jo")).toBe(true);
    expect(isMember(members, "bob")).toBe(false);
    expect(isMember(members, "constructor")).toBe(false);
    expect(isMember(members, null)).toBe(false);
  });
});

describe("deployment secrets", () => {
  const GOOD_SECRET = "a-real-session-secret-0123456789";
  const GOOD_CODE = "a-real-passcode-for-the-gate";
  const env = (secretValue: string | undefined, code: string | undefined) => {
    vi.stubEnv("SESSION_SECRET", secretValue);
    vi.stubEnv("GROUP_CODE", code);
  };
  afterEach(() => vi.unstubAllEnvs());

  it("rejects the shipped SESSION_SECRET placeholder, in any case", () => {
    env("change-me-32-plus-random-characters", GOOD_CODE);
    expect(() => secret()).toThrow(/SESSION_SECRET/);
    env("CHANGE-ME-32-plus-random-characters", GOOD_CODE);
    expect(() => secret()).toThrow(/SESSION_SECRET/);
  });

  it("rejects the shipped GROUP_CODE placeholder with a message to set a passcode", () => {
    env(GOOD_SECRET, "change-me-to-something-long");
    expect(() => secret()).toThrow(/GROUP_CODE/);
    expect(() => groupPasscode()).toThrow(/passcode/i);
  });

  it("rejects unset and short values", () => {
    env(undefined, GOOD_CODE);
    expect(() => secret()).toThrow(/SESSION_SECRET/);
    env("short", GOOD_CODE);
    expect(() => secret()).toThrow(/SESSION_SECRET/);
    env(GOOD_SECRET, undefined);
    expect(() => secret()).toThrow(/GROUP_CODE/);
    expect(() => groupPasscode()).toThrow(/GROUP_CODE/);
    env(GOOD_SECRET, "");
    expect(() => groupPasscode()).toThrow(/GROUP_CODE/);
  });

  it("accepts real values", () => {
    env(GOOD_SECRET, GOOD_CODE);
    expect(() => secret()).not.toThrow();
    expect(groupPasscode()).toBe(GOOD_CODE);
  });

  it("binds tokens to both values: rotating either signs everyone out", async () => {
    env(GOOD_SECRET, GOOD_CODE);
    const token = await sign("gate", secret());
    expect(await verify(token, secret())).toBe("gate");
    env(GOOD_SECRET, "another-real-passcode-entirely");
    expect(await verify(token, secret())).toBeNull();
    env("another-real-session-secret-9876", GOOD_CODE);
    expect(await verify(token, secret())).toBeNull();
    env(GOOD_SECRET, GOOD_CODE);
    expect(await verify(token, secret())).toBe("gate");
  });
});
