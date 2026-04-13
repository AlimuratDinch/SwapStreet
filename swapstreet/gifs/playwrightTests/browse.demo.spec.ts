import { test, expect } from "@playwright/test";

test("browse flow demo (real backend)", async ({ page }) => {
  // Sign in first so browse page loads with real data
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("ryad1@test.com");
  await page.locator("#password").fill("ryad1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });

  // Wait for listings to load
  await page.waitForTimeout(2000);

  // Scroll through the listings grid
  await page.evaluate(() => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  });
  await page.waitForTimeout(1500);

  // Use the search bar
  await page.getByPlaceholder(/search/i).fill("jacket");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2000);

  // Clear search and apply a category filter
  await page.getByPlaceholder(/search/i).clear();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);

  // Open the sidebar category filter and pick a category
  const categoryTrigger = page.getByRole("combobox").first();
  if (await categoryTrigger.isVisible()) {
    await categoryTrigger.click();
    await page.waitForTimeout(500);
    const firstOption = page.getByRole("option").first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    }
    await page.waitForTimeout(1500);
  }

  // Scroll to bottom to trigger infinite scroll
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
  await page.waitForTimeout(3000);
});
