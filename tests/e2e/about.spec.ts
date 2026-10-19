import { expect, test } from "@playwright/test";
import { E2E_MEMBERS, signIn } from "./helpers";

// A global `a { color }` once beat the Tailwind `text-cream` on the hero button, giving brown text
// on a brown pill. jsdom has no cascade, so this reads the colours a real browser resolved.
test("every link on the public about page is readable against its own background", async ({
  page,
}) => {
  await page.goto("/about");
  const failures = await page.evaluate(() => {
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const backdrop = (el: Element): number[] => {
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c;
      }
      return [255, 255, 255];
    };
    return [...document.querySelectorAll("a")]
      .filter((a) => a.textContent?.trim())
      .map((a) => {
        const fg = lum(rgb(getComputedStyle(a).color));
        const bg = lum(backdrop(a));
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        return { text: a.textContent?.trim().slice(0, 30), ratio: Math.round(ratio * 100) / 100 };
      })
      .filter((r) => r.ratio < 4.5);
  });
  expect(failures).toEqual([]);
});

test("the public about page never carries the member names", async ({
  playwright,
  baseURL,
  page,
}) => {
  await signIn(page);
  const fresh = await playwright.request.newContext({ baseURL });
  try {
    const html = await (await fresh.get("/about")).text();
    for (const name of E2E_MEMBERS) {
      expect(html, name).not.toMatch(new RegExp(`\\\\?"name\\\\?":\\\\?"${name}\\\\?"`));
    }
  } finally {
    await fresh.dispose();
  }
});
