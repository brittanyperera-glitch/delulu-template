import { expect, type Page } from "@playwright/test";
import { SETUP } from "@/app/setup/copy";

/**
 * The wall's anchor for waiting purposes. Deliberately the day stamp rather than the
 * days-left hero: the hero is being removed by the redesign, while the day stamp is kept in
 * both the empty and populated states, so this survives it.
 */
export const WALL_ANCHOR = /Day \d+ of \d+/;

/** Three people, so no flow can pass by assuming "the other one" is unique. */
export const E2E_MEMBERS = ["Alex", "Sam", "Jo"] as const;

export async function enterGate(page: Page): Promise<void> {
  await page.goto("/gate");
  await page.getByPlaceholder("code").fill("e2e-code");
  await page.getByPlaceholder("code").press("Enter");
}

/**
 * Gate, first-run setup if this database has never been used, then pick a name.
 *
 * The or() is not cosmetic. An untouched database lands on /setup and one with a season lands
 * on /name, and acting on page.url() right after the gate races the redirect. Wait for
 * whichever screen actually shows up.
 */
export async function signIn(
  page: Page,
  who: (typeof E2E_MEMBERS)[number] = "Alex",
): Promise<void> {
  await enterGate(page);
  await completeSetupOrPickName(page, who);
  await expect(page.getByText(WALL_ANCHOR).first()).toBeVisible();
}

export async function completeSetupOrPickName(
  page: Page,
  who: (typeof E2E_MEMBERS)[number],
): Promise<void> {
  const firstName = page.getByLabel(`${SETUP.namePlaceholder} 1`);
  const pick = page.getByRole("button", { name: who });
  await expect(firstName.or(pick).first()).toBeVisible();
  if (await firstName.isVisible()) {
    await page.getByRole("button", { name: SETUP.add }).click();
    for (const [i, name] of E2E_MEMBERS.entries()) {
      await page.getByLabel(`${SETUP.namePlaceholder} ${i + 1}`).fill(name);
    }
    await page.getByRole("button", { name: SETUP.cta }).click();
  }
  await pick.click();
}
