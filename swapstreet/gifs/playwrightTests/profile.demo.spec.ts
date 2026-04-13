import { test, expect } from "@playwright/test";

test("profile flow demo (real backend)", async ({ page }) => {
  // Sign in
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("ryad1@test.com");
  await page.locator("#password").fill("ryad1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Click the profile button in the header to open dropdown
  await page.getByRole("button", { name: "Profile" }).click();
  await page.waitForTimeout(800);

  // Click "View profile" from the dropdown
  await page.getByRole("link", { name: "View profile" }).click();
  await expect(page).toHaveURL(/\/profile/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Scroll down slowly
  await page.evaluate(() => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    window.scrollTo({ top: 800, behavior: "smooth" });
  });
  await page.waitForTimeout(3000);
});
