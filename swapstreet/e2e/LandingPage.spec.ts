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
});
