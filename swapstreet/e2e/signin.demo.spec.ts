import { test, expect } from "@playwright/test";

test("sign in flow demo (real backend)", async ({ page }) => {
  // 1) Go to landing page
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // 2) Go to sign-in page
  await page.locator('a[href="/auth/sign-in"]').first().click();

  // 3) Confirm sign-in page loaded
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();

  // 4) Fill real credentials
  await page.locator("#email").fill("ryad@test.com");
  await page.locator("#password").fill("ryad1234");

  // 5) Submit
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // 6) Expect redirect to browse
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });

  // 7) Pause for GIF recording
  await page.waitForTimeout(2500);
});
