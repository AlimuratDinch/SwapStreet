import { test, expect } from "@playwright/test";

test("landing page demo (for GIF)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("The Marketplace for")).toBeVisible();
  await page.waitForTimeout(2000); // hero typewriter

  // Scroll to features (no locator scroll => no "stable element" waiting)
  await page.evaluate(() => {
    document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(2500);

  // Scroll to impact
  await page.evaluate(() => {
    document.querySelector("#impact")?.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(3000);

  // Scroll to guide
  await page.evaluate(() => {
    document.querySelector("#guide")?.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(4000);

  // Scroll to bottom (CTA)
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
  await page.waitForTimeout(3000);
});
