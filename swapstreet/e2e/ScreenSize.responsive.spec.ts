import { test, expect } from "@playwright/test";

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
    });

    test(`loads without horizontal overflow @${vp.name}`, async ({ page }) => {
      // 1. BROAD API MOCKING
      // Intercept any call to the backend (port 8080) to prevent connection errors
      await page.route(/\/api\/auth\//, async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Unauthorized" }),
        });
      });

      const rawErrors: string[] = [];
      
      // 2. LISTENERS
      page.on("pageerror", (e) => rawErrors.push(e.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") rawErrors.push(msg.text());
      });

      // 3. NAVIGATION
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // 4. WAIT FOR STABILITY
      await expect(page.locator("body")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      
      // Short wait for any late-firing console errors
      await page.waitForTimeout(1000);

      // 5. MEASURE OVERFLOW
      const hasHorizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        // Check both body and documentElement for common overflow issues
        const body = document.body;
        return (
          doc.scrollWidth > doc.clientWidth + 1 || 
          body.scrollWidth > body.clientWidth + 1
        );
      });

      // 6. FILTERED ASSERTION
      // We filter the errors AT THE END to ensure we ignore backend noise
      // but still catch actual React/Next.js crashes.
      const filteredErrors = rawErrors.filter(err => {
        const isBackendError = err.includes("ERR_CONNECTION_REFUSED") || 
                               err.includes("8080") || 
                               err.includes("auth/refresh");
        const isCORSNoise = err.includes("Same Origin Policy") || err.includes("CORS");
        
        return !isBackendError && !isCORSNoise;
      });

      expect(
        filteredErrors, 
        `Actual JS errors found at ${vp.name}: ${filteredErrors.join(", ")}`
      ).toEqual([]);

      expect(
        hasHorizontalOverflow,
        `Horizontal overflow at ${vp.name} (ScrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)})`,
      ).toBeFalsy();

      // 7. ATTACH SCREENSHOT
      await test.info().attach(`screenshot-${vp.name}`, {
        body: await page.screenshot({ fullPage: false }),
        contentType: "image/png",
      });
    });
  });
}