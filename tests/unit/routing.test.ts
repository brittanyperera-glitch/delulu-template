import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { sign } from "@/lib/auth";
import { toMembersMap } from "@/lib/members";
import { decideRoute } from "@/lib/routing";
import { memberFromToken } from "@/lib/session";
import { config } from "@/proxy";

const S = "test-secret-with-enough-length-1234";
const MEMBERS = toMembersMap([
  { slug: "alex", name: "Alex", colour: "mustard", sortOrder: 0 },
  { slug: "sam", name: "Sam", colour: "sky", sortOrder: 1 },
]);

// [signed out, gated only, signed in]
type State = readonly [hasPlayer: boolean, hasGate: boolean];
const OUT: State = [false, false];
const GATED: State = [false, true];
const IN: State = [true, false];

describe("decideRoute", () => {
  it("sends a visitor with no cookie to the gate on a private deployment", () => {
    for (const p of ["/", "/post/3", "/bets", "/truth"]) {
      expect(decideRoute(p, ...OUT)).toBe("/gate");
      expect(decideRoute(p, ...IN)).toBe("allow");
    }
  });

  it("sends a visitor with no cookie to the public about page when publicLanding is set", () => {
    for (const p of ["/", "/post/3", "/bets", "/truth"]) {
      expect(decideRoute(p, ...OUT, true)).toBe("/about");
      expect(decideRoute(p, ...OUT, false)).toBe("/gate");
      expect(decideRoute(p, ...IN, true)).toBe("allow");
    }
    expect(decideRoute("/about", ...OUT, false)).toBe("allow");
    expect(decideRoute("/demo-code", ...OUT, false)).toBe("allow");
  });

  it("keeps a gated visitor without a name on /name whatever publicLanding says", () => {
    expect(decideRoute("/", ...GATED, true)).toBe("/name");
    expect(decideRoute("/", ...GATED, false)).toBe("/name");
  });

  // Found by the first real e2e run: two people opening first-run setup together, the loser was
  // redirected to "/" and landed on the marketing page with a valid gate cookie and no name.
  it("sends someone who has passed the gate but has no name to the name picker", () => {
    for (const p of ["/", "/post/3", "/bets", "/truth"]) {
      expect(decideRoute(p, ...GATED)).toBe("/name");
    }
  });

  it("serves the public pages to everyone", () => {
    for (const p of ["/about", "/demo-code"]) {
      for (const state of [OUT, GATED, IN]) expect(decideRoute(p, ...state)).toBe("allow");
    }
  });

  it("lets anyone reach the gate and moves members away from it", () => {
    expect(decideRoute("/gate", ...OUT)).toBe("allow");
    expect(decideRoute("/gate", ...GATED)).toBe("allow");
    expect(decideRoute("/gate", ...IN)).toBe("/");
  });

  it("shows the name picker only after the gate", () => {
    expect(decideRoute("/name", ...OUT)).toBe("/gate");
    expect(decideRoute("/name", ...GATED)).toBe("allow");
    expect(decideRoute("/name", ...IN)).toBe("/");
  });

  it("shows first-run setup only after the gate", () => {
    expect(decideRoute("/setup", ...OUT)).toBe("/gate");
    expect(decideRoute("/setup", ...GATED)).toBe("allow");
    // The page itself sends a member home once a season exists.
    expect(decideRoute("/setup", ...IN)).toBe("allow");
  });

  it("answers api routes with 401 instead of a redirect", () => {
    expect(decideRoute("/api/unfurl", ...OUT)).toBe("401");
    expect(decideRoute("/api/unfurl", ...GATED)).toBe("401");
    expect(decideRoute("/api/unfurl", ...IN)).toBe("allow");
  });

  it("lets the blob callback through, since it carries no cookies", () => {
    expect(decideRoute("/api/upload", ...OUT)).toBe("allow");
  });

  // Found by a real request: the proxy answered 401 before the route could check its bearer
  // secret, so the daily cron call could never reach it.
  it("lets the demo reset through, since the cron call has no cookies and the route checks its secret", () => {
    for (const state of [OUT, GATED, IN]) {
      expect(decideRoute("/api/demo-reset", ...state)).toBe("allow");
    }
  });
});

describe("a cookie for a member who was removed", () => {
  it("is treated as signed out by the same lookup the pages use, so there is no / <-> /gate loop", async () => {
    const token = await sign("ghost", S);
    const who = await memberFromToken(token, S, MEMBERS);
    expect(who).toBeNull();
    const hasPlayer = who !== null;
    // "/" must not allow (getPlayer would bounce to /gate) and /gate must not bounce back to "/".
    expect(decideRoute("/", hasPlayer, false)).toBe("/gate");
    expect(decideRoute("/gate", hasPlayer, false)).toBe("allow");
  });

  it("still signs in a current member", async () => {
    expect(await memberFromToken(await sign("sam", S), S, MEMBERS)).toBe("sam");
  });
});

describe("proxy matcher", () => {
  const re = new RegExp(`^${config.matcher[0]}$`);
  const covered = (p: string) => re.test(p);

  it("never redirects static assets, social previews, screenshots or crawler files", () => {
    for (const p of [
      "/_next/static/chunk.js",
      "/_next/image",
      "/favicon.ico",
      "/manifest.webmanifest",
      "/icon.svg",
      "/icon-192.png",
      "/icon-512.png",
      "/apple-touch-icon.png",
      "/og/home.png",
      "/screens/wall.png",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      expect(covered(p), p).toBe(false);
    }
  });

  it("still guards the app and the lookalike paths", () => {
    for (const p of ["/", "/about", "/bets", "/api/unfurl", "/ogre", "/screensaver"]) {
      expect(covered(p), p).toBe(true);
    }
  });
});

describe("pwa start_url", () => {
  it("resolves for a member and lands on a public or gate page for a stranger", () => {
    const start = manifest().start_url as string;
    expect(decideRoute(start, ...IN)).toBe("allow");
    expect(decideRoute(start, ...OUT)).toBe("/gate");
    expect(decideRoute(start, ...OUT, true)).toBe("/about");
  });
});
