import { test, expect } from "@playwright/test";

test("chat flow demo (real backend)", async ({ page }) => {
  // Sign in
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("ryad1@test.com");
  await page.locator("#password").fill("ryad1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Click the chat icon in the header
  await page.getByRole("button", { name: "Messages" }).click();
  await expect(page).toHaveURL(/\/chat/, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Click the first chat in the sidebar
  await page
    .locator('button.chatroomButton, [class*="chatroomButton"]')
    .first()
    .click();
  await page.waitForTimeout(1500);

  // Type a message and send it
  await page
    .getByPlaceholder("Type Message Here")
    .fill("Hey, is this still available?");
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
});
