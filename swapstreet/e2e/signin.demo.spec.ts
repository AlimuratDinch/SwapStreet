import { test, expect } from "@playwright/test";

test("sign in flow demo (real backend)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // locate sign in path 
  await page.locator('a[href="/auth/sign-in"]').first().click();

  // confirm on sign in page
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

  // fill form 
  await page.locator("#email").fill("ryad@test.com");
  await page.locator("#password").fill("ryad1234");

  // submit
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // to be redirected to browse page (confirm sign in success)
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });

  await page.waitForTimeout(2500);
});
