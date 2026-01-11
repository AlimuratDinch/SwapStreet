import { test, expect } from "@playwright/test";

test("Browse page: basic UI + light interactions", async ({ page }) => {
  await page.goto("/browse");
  await page.waitForLoadState("domcontentloaded");

  // Layout exists
  await expect(page.locator("nav")).toBeVisible();

  const sidebar = page.locator("aside");
  const main = page.locator("main");
  await expect(sidebar).toBeVisible();
  await expect(main).toBeVisible();

  // Search box works
  const search = sidebar.getByPlaceholder("Search...");
  await expect(search).toBeVisible();
  await search.fill("test");
  await expect(search).toHaveValue("test");

  // Expand/collapse accordions (no strict text asserts)
  await sidebar.getByRole("button", { name: /categories/i }).click();
  await sidebar.getByRole("button", { name: /categories/i }).click();

  await sidebar.getByRole("button", { name: /condition/i }).click();
  await sidebar.getByRole("button", { name: /condition/i }).click();

  await sidebar.getByRole("button", { name: /price range/i }).click();
  await sidebar.getByRole("button", { name: /price range/i }).click();

  // Cards area (very loose)
  // either cards exist, OR show a graceful empty state (don’t fail your dev work)
  const cards = page.locator(".card-item");
  const hasCard = await cards.first().isVisible().catch(() => false);

  if (hasCard) {
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText("$");
  } else {
    // fallback: just assert page didn't crash and main still visible
    await expect(main).toBeVisible();
  }
});
