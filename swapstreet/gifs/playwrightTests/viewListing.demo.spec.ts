import { test, expect } from "@playwright/test";

test("view listing flow demo (real backend)", async ({ page }) => {
  await page.addInitScript(() => {
    window.open = (url) => {
      window.location.href = url as string;
      return null;
    };
  });

  // Sign in
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("ryad1@test.com");
  await page.locator("#password").fill("ryad1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });

  // Wait for listings grid to load
  await page.waitForTimeout(2500);

  // Click the Black Dress #88 listing
  await page
    .locator('[role="button"]')
    .filter({ hasText: "Black Dress #88" })
    .first()
    .click();

  // Wait on the listing page
  await expect(page).toHaveURL(/\/listing/, { timeout: 10000 });
  await page.waitForTimeout(5000);
});
