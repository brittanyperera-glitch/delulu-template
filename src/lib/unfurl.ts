import { SITE } from "@/config/site";
import type { LinkMeta } from "@/lib/db/schema";

type Provider = NonNullable<LinkMeta["provider"]>;

export function providerFor(url: string): { provider: Provider; endpoint: string } | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const u = encodeURIComponent(url);
  if (host === "open.spotify.com")
    return { provider: "spotify", endpoint: `https://open.spotify.com/oembed?url=${u}` };
  if (
    host === "youtube.com" ||
    host === "youtu.be" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  )
    return { provider: "youtube", endpoint: `https://www.youtube.com/oembed?format=json&url=${u}` };
  if (host === "soundcloud.com")
    return {
      provider: "soundcloud",
      endpoint: `https://soundcloud.com/oembed?format=json&url=${u}`,
    };
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function meta(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i",
  );
  const m = html.match(re) ?? html.match(re2);
  return m ? decode(m[1]) : undefined;
}

const PRIVATE =
  /^(localhost|\[?::1\]?|0\.0\.0\.0|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE.test(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal");
}

export function parseOpenGraph(html: string, url: string): LinkMeta {
  const title =
    meta(html, "og:title") ??
    (decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "") || new URL(url).hostname);
  const image = meta(html, "og:image");
  const site = meta(html, "og:site_name");
  const out: LinkMeta = { url, title };
  if (image) out.image = image;
  if (site) out.site = site;
  return out;
}

const MAX_HOPS = 3;

/** Redirects are followed by hand so each hop gets the same private-host check as the first URL. */
async function withTimeout(fetchImpl: typeof fetch, input: string, ms = 5000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    let target = input;
    for (let hop = 0; ; hop++) {
      const res = await fetchImpl(target, {
        signal: ctl.signal,
        redirect: "manual",
        headers: { "user-agent": `${SITE.name.toLowerCase().replace(/\W+/g, "")}/1.0` },
      });
      const location = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !location || hop >= MAX_HOPS) return res;
      const next = new URL(location, target);
      if (!/^https?:$/.test(next.protocol) || isPrivateHost(next.hostname)) return res;
      target = next.href;
    }
  } finally {
    clearTimeout(t);
  }
}

export async function unfurl(url: string, fetchImpl: typeof fetch = fetch): Promise<LinkMeta> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, title: "link" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { url, title: "link" };
  // Never let a pasted link make the server fetch something on its own network.
  if (isPrivateHost(parsed.hostname)) return { url, title: "link" };
  const fallback: LinkMeta = { url, title: parsed.hostname.replace(/^www\./, "") };
  try {
    const p = providerFor(url);
    if (p) {
      const res = await withTimeout(fetchImpl, p.endpoint);
      if (res.ok) {
        const j = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
          provider_name?: string;
          author_name?: string;
        };
        const out: LinkMeta = { url, title: j.title ?? fallback.title, provider: p.provider };
        if (j.thumbnail_url) out.image = j.thumbnail_url;
        if (j.provider_name) out.site = j.provider_name;
        if (j.author_name) out.author = j.author_name;
        return out;
      }
    }
    const res = await withTimeout(fetchImpl, url);
    if (!res.ok) return fallback;
    const html = (await res.text()).slice(0, 200_000);
    const og = parseOpenGraph(html, url);
    if (parsed.hostname.replace(/^www\./, "") === "music.apple.com") {
      // Apple Music has no oEmbed, so it falls to Open Graph, which gives the title and art but
      // not the artist. Its <title> reads "<name> by <artist> on Apple Music", so read it there.
      og.provider = "apple";
      og.site = "Apple Music";
      const pageTitle = decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
      const by = pageTitle.match(/\bby (.+?) on Apple Music/i);
      if (by) og.author = by[1].trim();
    }
    return og;
  } catch {
    return fallback;
  }
}
