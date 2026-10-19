import { describe, expect, it } from "vitest";
import { isPrivateHost, parseOpenGraph, providerFor, unfurl } from "@/lib/unfurl";

describe("providerFor", () => {
  it("knows the three music hosts", () => {
    expect(providerFor("https://open.spotify.com/track/abc")?.provider).toBe("spotify");
    expect(providerFor("https://youtu.be/xyz")?.provider).toBe("youtube");
    expect(providerFor("https://www.youtube.com/watch?v=xyz")?.provider).toBe("youtube");
    expect(providerFor("https://soundcloud.com/a/b")?.provider).toBe("soundcloud");
    expect(providerFor("https://example.com")).toBeNull();
  });
});

describe("parseOpenGraph", () => {
  it("reads og tags and falls back to <title>", () => {
    const html = `<html><head><title>Fallback</title>
      <meta property="og:title" content="A Song &amp; A Dance">
      <meta property="og:image" content="https://img.example/x.jpg">
      <meta property="og:site_name" content="Example"></head></html>`;
    expect(parseOpenGraph(html, "https://example.com/p")).toEqual({
      url: "https://example.com/p",
      title: "A Song & A Dance",
      image: "https://img.example/x.jpg",
      site: "Example",
    });
    expect(parseOpenGraph("<title>Only Title</title>", "https://example.com").title).toBe(
      "Only Title",
    );
  });
});

describe("unfurl", () => {
  it("uses oEmbed for known providers", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          title: "Track",
          thumbnail_url: "https://i/t.jpg",
          provider_name: "Spotify",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )) as typeof fetch;
    const meta = await unfurl("https://open.spotify.com/track/abc", fetchImpl);
    expect(meta).toEqual({
      url: "https://open.spotify.com/track/abc",
      title: "Track",
      image: "https://i/t.jpg",
      site: "Spotify",
      provider: "spotify",
    });
  });
  it("falls back to the hostname when everything fails", async () => {
    const fetchImpl = (async () => {
      throw new Error("boom");
    }) as typeof fetch;
    expect(await unfurl("https://example.com/a/b", fetchImpl)).toEqual({
      url: "https://example.com/a/b",
      title: "example.com",
    });
  });
  it("does not follow a redirect to a private address", async () => {
    const seen: string[] = [];
    const fetchImpl = (async (input: string, init?: RequestInit) => {
      expect(init?.redirect).toBe("manual");
      seen.push(String(input));
      return new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data" },
      });
    }) as unknown as typeof fetch;
    expect(await unfurl("https://example.com/r", fetchImpl)).toEqual({
      url: "https://example.com/r",
      title: "example.com",
    });
    expect(seen).toEqual(["https://example.com/r"]);
  });
  it("follows a public redirect and stops after three hops", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      return new Response(null, { status: 302, headers: { location: `https://example.com/${n}` } });
    }) as unknown as typeof fetch;
    await unfurl("https://example.com/start", fetchImpl);
    expect(n).toBe(4);
  });
  it("refuses anything that is not http(s)", async () => {
    expect(await unfurl("javascript:alert(1)")).toEqual({
      url: "javascript:alert(1)",
      title: "link",
    });
  });
  it("refuses a private or loopback host", async () => {
    expect(isPrivateHost("localhost")).toBe(true);
    expect(isPrivateHost("192.168.1.4")).toBe(true);
    expect(isPrivateHost("open.spotify.com")).toBe(false);
    expect(await unfurl("http://127.0.0.1:3000/admin")).toEqual({
      url: "http://127.0.0.1:3000/admin",
      title: "link",
    });
  });
  it("keeps the oEmbed author as the artist", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({ title: "Track", author_name: "The Delulus", provider_name: "Spotify" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )) as typeof fetch;
    expect((await unfurl("https://open.spotify.com/track/abc", fetchImpl)).author).toBe(
      "The Delulus",
    );
  });
  it("reads Apple Music by Open Graph and pulls the artist off the page title", async () => {
    const html = `<html><head>
      <title>Anti-Hero by Taylor Swift on Apple Music</title>
      <meta property="og:title" content="Anti-Hero">
      <meta property="og:image" content="https://is.apple/art.jpg"></head></html>`;
    const fetchImpl = (async () =>
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch;
    expect(await unfurl("https://music.apple.com/us/album/anti-hero/123", fetchImpl)).toEqual({
      url: "https://music.apple.com/us/album/anti-hero/123",
      title: "Anti-Hero",
      image: "https://is.apple/art.jpg",
      site: "Apple Music",
      provider: "apple",
      author: "Taylor Swift",
    });
  });
});
