import { test, expect } from '@playwright/test';

test.describe('Landing page tests', () => {
  // go to the home page and check main heading + CTA
  test('hero heading and CTA visible', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1, name: 'The Marketplace for Endless Outfits' });
    await expect(h1).toBeVisible();
    const cta = page.getByRole('link', { name: 'Start Shopping' });
    await expect(cta).toBeVisible();
  });

  // check the stats section shows expected labels
  test('environmental stats are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Clothes Saved/i)).toBeVisible();
    await expect(page.getByText(/CO2 Reduced/i)).toBeVisible();
    await expect(page.getByText(/Liters Saved/i)).toBeVisible();
    await expect(page.getByText(/Active Users/i)).toBeVisible();
  });

  // check the hero background uses our local image
  test('hero background uses local image', async ({ page }) => {
    await page.goto('/');
    const bg = page.locator('div[style*="/images/hero.jpg"]');
    await expect(bg).toHaveCount(1);
  });

  // months below the chart should be visible
  test('monthly labels are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Jan')).toBeVisible();
    await expect(page.getByText('Dec')).toBeVisible();
  });

  // Responsiveness checks: no horizontal scroll, no overlap, headline size
  test('responsiveness sanity: no horizontal scroll, no overlap, typography sane', async ({ page }) => {
    await page.goto('/');

    // no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);

    // check main elements don't overlap and are inside viewport
    const nav = page.locator('nav');
    const h1 = page.getByRole('heading', { level: 1 });
    const cta = page.getByRole('link', { name: 'Start Shopping' }).first();

    const navBox = await nav.boundingBox();
    const h1Box = await h1.boundingBox();
    const ctaBox = await cta.boundingBox();
    const viewport = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));

    expect(navBox).toBeTruthy();
    expect(h1Box).toBeTruthy();
    expect(ctaBox).toBeTruthy();

    if (!navBox || !h1Box || !ctaBox) {
      throw new Error('Could not measure element boxes');
    }

    type Box = { x: number; y: number; width: number; height: number };
    const isContained = (box: Box) => box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.w + 1 && box.y + box.height <= viewport.h + 1;
    const intersects = (a: Box, b: Box) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

    expect(isContained(navBox)).toBeTruthy();
    expect(isContained(h1Box)).toBeTruthy();
    expect(isContained(ctaBox)).toBeTruthy();

    const navBottom = navBox.y + navBox.height;
    expect(h1Box.y).toBeGreaterThanOrEqual(navBottom - 2);
    expect(intersects(h1Box, ctaBox)).toBeFalsy();

    // headline font-size should be reasonable
    const h1FontSize = await page.evaluate(() => {
      const el = document.querySelector('h1');
      return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
    });
    expect(h1FontSize).toBeGreaterThan(20);
    expect(h1FontSize).toBeLessThanOrEqual(Math.max(24, innerWidth * 0.25));
  });
});
