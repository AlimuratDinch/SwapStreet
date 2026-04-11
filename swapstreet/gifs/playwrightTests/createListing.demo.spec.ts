import { test, expect } from "@playwright/test";

test("create listing flow demo (real backend)", async ({ page }) => {
  // Sign in
  await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("ryad1@test.com");
  await page.locator("#password").fill("ryad1234");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/browse/, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Navigate to create listing page
  await page.goto("/seller/createListing", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Create a new listing" })).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1000);

  // Fill in title
  await page.locator("#title").fill("Vintage Denim Jacket");
  await page.waitForTimeout(500);

  // Fill in description
  await page.locator("#description").fill("Classic vintage denim jacket in great condition. Barely worn, very comfortable.");
  await page.waitForTimeout(500);

  // Select category
  await page.locator("#category").selectOption("Outerwear");
  await page.waitForTimeout(400);

  // Select brand
  await page.locator("#brand").selectOption("Nike");
  await page.waitForTimeout(400);

  // Select condition
  await page.locator("#condition").selectOption("LikeNew");
  await page.waitForTimeout(400);

  // Select size
  await page.locator("#size").selectOption("M");
  await page.waitForTimeout(400);

  // Select colour
  await page.locator("#colour").selectOption("Blue");
  await page.waitForTimeout(400);

  // Fill in price
  await page.locator("#price").fill("45");
  await page.waitForTimeout(400);

  // Upload a minimal placeholder image
  await page.locator("#images").setInputFiles({
    name: "listing.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page.waitForTimeout(1000);

  // Scroll down to see the full form
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
  await page.waitForTimeout(1500);

  // Submit the form
  await page.getByRole("button", { name: "Create Listing" }).click();

  // Should redirect to profile page after successful creation
  await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
  await page.waitForTimeout(2000);
});
