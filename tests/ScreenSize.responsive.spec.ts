import { test, expect } from '@playwright/test';

// Common viewport sizes to validate responsive behavior.
// Adjust or extend this list to match your app's breakpoints.
const viewports = [
  { name: 'mobile-375x667', width: 375, height: 667 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
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
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // baseURL is set in playwright.config
      await page.goto('/');

      // Generic smoke check that page is loaded.
      await expect(page.locator('body')).toBeVisible();
      // Allow network to go idle so heavy pages stabilize before screenshot.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      // ensure layout fits the viewport width (no horizontal scrollbar/overflow).
      const hasHorizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth;
      });

      expect(errors, `Console/page errors at ${vp.name}`).toEqual([]);
      expect(hasHorizontalOverflow, `Horizontal overflow at ${vp.name}`).toBeFalsy();

      // Attach a viewport-sized screenshot (faster than fullPage on tall docs).
      await test.info().attach(`screenshot-${vp.name}`, {
        body: await page.screenshot({ fullPage: false, timeout: 30000 }),
        contentType: 'image/png',
      });
    });
  });
}
