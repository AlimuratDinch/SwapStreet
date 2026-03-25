import { test, expect } from "@playwright/test";

// Common viewport sizes to validate responsive behavior.
const viewports = [
  { name: "mobile-375x667", width: 375, height: 667 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test.describe(`viewport: ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    });

    test(`loads without horizontal overflow @${vp.name}`, async ({ page }) => {
      // 1. MOCK AUTH API: Intercept the silent refresh call.
      // This prevents "Connection Refused" errors in CI.
      await page.route("**/api/auth/refresh", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "No active session" }),
        });
      });

      const errors: string[] = [];

      // 2. COLLECT ERRORS: Listen for actual code crashes.
      page.on("pageerror", (e) => errors.push(e.message));

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // FILTER: Ignore connection errors to the auth endpoint if they still slip through
          if (
            text.includes("ERR_CONNECTION_REFUSED") ||
            text.includes("auth/refresh")
          ) {
            return;
          }
          errors.push(text);
        }
      });

      // 3. NAVIGATION: Load the page.
      await page.goto("/");

      // 4. STABILITY: Wait for layout to settle.
      await expect(page.locator("body")).toBeVisible();

      // Ensure fonts are loaded before measuring width
      await page.evaluate(() => document.fonts.ready);

      // Allow network to go idle, but catch timeout so the test doesn't crash
      await page
        .waitForLoadState("networkidle", { timeout: 5000 })
        .catch(() => {});

      // 5. MEASURE: Check for horizontal overflow.
      const hasHorizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        // We use a 1px buffer to account for sub-pixel rendering in headless browsers
        return doc.scrollWidth > doc.clientWidth + 1;
      });

      // 6. ASSERTIONS
      expect(
        errors,
        `Unexpected Console/Page errors at ${vp.name}: ${errors.join(", ")}`,
      ).toEqual([]);

      expect(
        hasHorizontalOverflow,
        `Horizontal overflow detected at ${vp.name} (ScrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)})`,
      ).toBeFalsy();

      // 7. ATTACHMENTS: Screenshot for visual debugging
      await test.info().attach(`screenshot-${vp.name}`, {
        body: await page.screenshot({ fullPage: false }),
        contentType: "image/png",
      });
    });
  });
}
