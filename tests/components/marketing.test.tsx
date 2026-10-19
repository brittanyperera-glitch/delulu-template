// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";
import { ROOMS } from "@/components/marketing/rooms";

describe("about page", () => {
  let container: HTMLElement;
  let text: string;
  beforeEach(() => {
    container = render(<AboutPage />).container;
    text = container.textContent ?? "";
  });

  it("has exactly one h1 and the landmarks", () => {
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelectorAll("header, main, footer")).toHaveLength(3);
  });

  it("gives every image a real alt", () => {
    const imgs = [...container.querySelectorAll("img, [role=img]")];
    expect(imgs.length).toBeGreaterThan(0);
    for (const el of imgs) {
      const alt = el.getAttribute("alt") ?? el.getAttribute("aria-label") ?? "";
      expect(alt.trim().length).toBeGreaterThan(3);
    }
  });

  it("renders every room and its blurb under 18 words", () => {
    expect(ROOMS).toHaveLength(11);
    for (const r of ROOMS) {
      expect(text).toContain(r.blurb);
      expect(r.blurb.split(/\s+/).length).toBeLessThan(18);
    }
    expect(container.querySelectorAll("#rooms + ul > li")).toHaveLength(11);
  });

  it("has no element text block over 40 words and no em dashes", () => {
    const leaves = [...container.querySelectorAll("p, li, h1, h2, h3, a, span")].filter(
      (el) => el.querySelector("p, li, h3") === null,
    );
    for (const el of leaves) {
      expect((el.textContent ?? "").trim().split(/\s+/).length).toBeLessThanOrEqual(40);
    }
    expect(text).not.toContain("—");
  });
});
