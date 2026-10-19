import { expect, type Page, test } from "@playwright/test";
import { STRINGS } from "@/lib/content/strings";
import { completeSetupOrPickName, signIn, WALL_ANCHOR } from "./helpers";

/**
 * The only way into the composer on an EMPTY wall is the inline CTA; once there are posts it is
 * the Fab. Both open the same composer, and the wall deliberately never shows both at once.
 */
async function openComposer(page: Page) {
  const first = page.getByRole("button", { name: STRINGS.home.first });
  const fab = page.getByRole("button", { name: STRINGS.home.add });
  await expect(first.or(fab).first()).toBeVisible();
  await ((await first.isVisible()) ? first : fab).click();
}

test("gate, name, post, stamp, react, comment, no sideways scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/gate$/);
  await page.goto("/gate");
  // fill() sets the value and dispatches input, which is why this works on a
  // password field. Synthetic keystrokes do not reach one; do not switch to type().
  await page.getByPlaceholder("code").fill("wrong");
  await page.getByPlaceholder("code").press("Enter");
  await expect(page).toHaveURL(/\/gate\?x=\d+$/);
  await page.getByPlaceholder("code").fill("e2e-code");
  await page.getByPlaceholder("code").press("Enter");
  // An untouched database lands on /setup, one that already has a season on /name. Wait for
  // whichever arrives rather than reading page.url() straight after the redirect.
  await expect(page).toHaveURL(/\/(setup|name)$/);
  await completeSetupOrPickName(page, "Alex");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(WALL_ANCHOR).first()).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);

  await openComposer(page);
  const skinName = `E2E ${Date.now()}`;
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.getByPlaceholder("name").fill(skinName);
  await page.getByRole("button", { name: "Add skin" }).click();
  const body = `smoke ${Date.now()}`;
  await page.getByPlaceholder("Say the ridiculous thing").fill(body);
  await page.getByRole("button", { name: "Big Dubs", exact: true }).click();
  await page.getByRole("button", { name: "Post it" }).click();
  await expect(page.getByText(body)).toBeVisible({ timeout: 15000 });

  // Click the anchor, not the text node inside it, and wait for the navigation rather
  // than asserting the URL on a 5s budget. Clicking the text raced the re-render.
  await page.getByRole("link", { name: new RegExp(body) }).click();
  await page.waitForURL(/\/post\/\d+$/);
  // From STRINGS, not a literal: this asserted on a reaction word that had been replaced
  // and nothing caught it. Not exact, because reacting appends ", Alex" to the label.
  const reaction = STRINGS.reactions[2];
  await page.getByRole("button", { name: reaction }).click();
  await expect(page.getByRole("button", { name: reaction })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByPlaceholder("say something").fill("unhinged, keep going");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("unhinged, keep going")).toBeVisible();

  await page.goto("/wall/w");
  await expect(page.getByText(body)).toBeVisible();
  // The renamed filter title end to end: the stamp stores "W" and the page reads "Big Dubs".
  await expect(page.getByRole("heading", { name: "Big Dubs" })).toBeVisible();
});

// A real Vercel Blob store is needed to upload anything. Without one the app
// correctly refuses and offers a retry, so the photo case is skipped rather
// than asserting a failure. Voice and video are hand-verified on the phone.
const hasBlobStore =
  !!process.env.BLOB_READ_WRITE_TOKEN &&
  process.env.BLOB_READ_WRITE_TOKEN.startsWith("vercel_blob_");

async function newSkin(page: Page, label: string) {
  await openComposer(page);
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.getByPlaceholder("name").fill(`${label} ${Date.now()}`);
  await page.getByRole("button", { name: "Add skin" }).click();
}

test("posts a link with a fetched card", async ({ page }) => {
  await signIn(page);

  // Stubbed so the test never depends on a third party being up.
  await page.route("**/api/unfurl**", (route) =>
    route.fulfill({
      json: { url: "https://open.spotify.com/track/abc", title: "A Track", site: "Spotify" },
    }),
  );

  await newSkin(page, "E2E link");
  await page.getByRole("tab", { name: "Link" }).click();
  await page.getByPlaceholder("paste a link").fill("https://open.spotify.com/track/abc");
  await expect(page.getByText("A Track")).toBeVisible();
  const caption = `link ${Date.now()}`;
  await page.getByPlaceholder("one line, optional").fill(caption);
  await page.getByRole("button", { name: "Post it" }).click();
  await expect(page.getByText(caption)).toBeVisible({ timeout: 15000 });
});

test("posts a photo", async ({ page }) => {
  test.skip(!hasBlobStore, "needs a real Vercel Blob store, so this runs once deployed");
  await signIn(page);
  await newSkin(page, "E2E photo");
  await page.getByRole("tab", { name: "Photo" }).click();
  await page.setInputFiles('input[accept="image/*"]', "tests/e2e/fixtures/photo.jpg");
  const caption = `photo ${Date.now()}`;
  await page.getByPlaceholder("one line, optional").fill(caption);
  await page.getByRole("button", { name: "Post it" }).click();
  await expect(page.getByText(caption)).toBeVisible({ timeout: 20000 });
});
