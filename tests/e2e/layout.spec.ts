import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

/**
 * The layout invariant, promoted from the hand-run rig at .claude/measure/uibar.mjs.
 *
 * Before this, the only layout assertion in the whole suite was one route at one width (the
 * wall at 390px), which is how a route that scrolled sideways at 404px shipped.
 *
 * There is deliberately NO theme axis. The rig sweeps light and dark, but this app has no
 * dark mode at all: no prefers-color-scheme, no data-theme and no dark: variant anywhere in
 * src. So the rig's 130 combinations are 65 distinct renders measured twice, and this covers
 * the 65 that mean anything. If a dark theme is ever added, add the axis and it doubles.
 *
 * One test per route, because playwright.config.ts sets a 60s timeout PER TEST and a single
 * test holding every route at every width does not finish.
 */
const ROUTES = [
  "/",
  "/delusions",
  "/skins",
  "/manifesto",
  "/spoilers",
  "/jar",
  "/dares",
  "/bets",
  "/soundtrack",
  "/bombs",
  "/prophecies",
  "/truth",
  "/checkpoints",
];

// 404 is here because it is the width that shipped a sideways-scrolling route while 390
// passed. A sweep that omits the case in its own justification is decoration.
const WIDTHS = [1680, 1440, 1280, 1024, 404, 390];

type Finding = { kind: string; detail: string };

/**
 * Runs in the page. Four defect classes plus document sideways scroll, all measured from real
 * boxes rather than eyeballed: a 3px clip is invisible in a screenshot and fatal to a word.
 *
 * Three exclusions, every one of them learned from this check's own first red run, and every
 * one load-bearing. A checker that fires on intentional design is worse than no checker,
 * because it teaches you to ignore it:
 *
 *  - A ROTATED element's client rect includes its transform, so every tilted scrap and the
 *    tilted manifesto line "escaped" its parent by design.
 *  - Anything inside a HORIZONTAL SCROLLER is meant to sit outside the viewport; that is what
 *    the scroller is for. The filter row is one, and it produced the same false finding that
 *    had already been retracted once by hand.
 *  - Anything CLIPPED by an ancestor is measured by what is actually VISIBLE of it, not by
 *    its full box. The soundtrack's disc bleeds off its sleeve on purpose and is caught by
 *    the sleeve, so nothing escapes. Exempting every descendant of a clipping ancestor
 *    instead, which is what this did first, disarmed the whole check on the wall: Card
 *    carries overflow-hidden and Card wraps every scrap, the all-clear panel and the creed
 *    block, so the entire home page was skipped.
 *
 * What survives all three is the part that matters: a document that scrolls sideways, text
 * clipped with no ellipsis to say so, and a scroll region inside another one.
 */
function measure(): { docWidth: number; viewport: number; findings: Finding[] } {
  const findings: Finding[] = [];
  const viewport = window.innerWidth;
  const describe = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute("class") ?? "").slice(0, 50);
    const text = (el.textContent ?? "").trim().slice(0, 30);
    return `${tag}.${cls} "${text}"`;
  };
  const scrollsX = (s: CSSStyleDeclaration) => s.overflowX === "auto" || s.overflowX === "scroll";
  const scrollsY = (s: CSSStyleDeclaration) => s.overflowY === "auto" || s.overflowY === "scroll";

  /** Transformed anywhere up the chain, or sitting inside a horizontal scroller. */
  function excused(el: Element): { transformed: boolean; inScroller: boolean } {
    let transformed = false;
    let inScroller = false;
    let node: Element | null = el;
    while (node && node !== document.body) {
      const s = getComputedStyle(node);
      // Tailwind v4 sets the INDIVIDUAL rotate/scale/translate properties, not the transform
      // shorthand, so checking transform alone reads "none" on a -rotate-1 element and the
      // manifesto line gets reported as escaping its parent by design.
      if (
        s.transform !== "none" ||
        s.rotate !== "none" ||
        s.scale !== "none" ||
        s.translate !== "none"
      ) {
        transformed = true;
      }
      if (node !== el && scrollsX(s)) inScroller = true;
      node = node.parentElement;
    }
    return { transformed, inScroller };
  }

  /**
   * How much of this element can actually be SEEN, after every clipping ancestor has had its
   * say. This is the honest measurement: a disc half outside its sleeve is not escaping the
   * window, but a button sliced by its own panel still is, and both have the same full box.
   */
  function visibleRect(el: Element): { left: number; right: number } | null {
    const b = el.getBoundingClientRect();
    let left = b.left;
    let right = b.right;
    let node = el.parentElement;
    while (node && node !== document.body) {
      const s = getComputedStyle(node);
      if (s.overflowX === "hidden" || s.overflowX === "clip" || scrollsX(s)) {
        const pb = node.getBoundingClientRect();
        left = Math.max(left, pb.left);
        right = Math.min(right, pb.right);
        if (right <= left) return null;
      }
      node = node.parentElement;
    }
    return { left, right };
  }

  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    const { transformed, inScroller } = excused(el);

    if (!transformed && !inScroller && style.position !== "fixed") {
      const seen = visibleRect(el);
      if (seen && (seen.right > viewport + 1 || seen.left < -1)) {
        findings.push({ kind: "escapes-viewport", detail: describe(el) });
      }
    }

    // Escapes its parent's CONTENT box. This is the class a screenshot cannot catch: a
    // collapse button sliced by its own panel edge reads as fine at a glance.
    const parent = el.parentElement;
    if (!transformed && !inScroller && parent && parent !== document.body) {
      const ps = getComputedStyle(parent);
      if (ps.overflow === "visible" && ps.position !== "fixed" && style.position === "static") {
        const pb = parent.getBoundingClientRect();
        const padRight = Number.parseFloat(ps.paddingRight) || 0;
        if (box.right > pb.right - padRight + 1) {
          findings.push({ kind: "escapes-parent", detail: describe(el) });
        }
      }
    }

    // A scrollable region inside another scrollable region costs two gestures to read one
    // card, and crops answers mid-number.
    if (scrollsY(style) && el.scrollHeight > el.clientHeight + 1) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ps = getComputedStyle(p);
        if (scrollsY(ps) && p.scrollHeight > p.clientHeight + 1) {
          findings.push({ kind: "nested-scroll", detail: describe(el) });
          break;
        }
        p = p.parentElement;
      }
    }

    // Text cut off with no ellipsis to say so.
    if (
      el.children.length === 0 &&
      (el.textContent ?? "").trim().length > 0 &&
      style.overflowX === "hidden" &&
      style.textOverflow !== "ellipsis" &&
      el.scrollWidth > el.clientWidth + 1
    ) {
      findings.push({ kind: "clipped-no-ellipsis", detail: describe(el) });
    }
  }
  return { docWidth: document.documentElement.scrollWidth, viewport, findings };
}

test.describe("layout invariant", () => {
  for (const route of ROUTES) {
    test(`${route} holds at every width`, async ({ page }) => {
      await signIn(page);
      const problems: string[] = [];
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const { docWidth, viewport, findings } = await page.evaluate(measure);
        if (docWidth > viewport + 1) {
          problems.push(`${route} @${width}: scrolls sideways (${docWidth} > ${viewport})`);
        }
        for (const f of findings) problems.push(`${route} @${width}: ${f.kind}: ${f.detail}`);
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});
