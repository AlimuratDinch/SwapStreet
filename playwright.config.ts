import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporters */
  reporter: [['list'], ['html', { open: 'never' }]],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL for your app under test */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },

  /* Run local dev server before starting the tests (helpful in CI) */
  webServer: {
    command: 'npm ci &&npm --prefix ./swapstreet run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },

  /* Configure projects for browser + device combinations (desktop / tablet / mobile) */
  projects: [
    // Desktop browsers
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },

    // Tablet
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },

    // Mobile
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'pixel-5', use: { ...devices['Pixel 5'] } },
  ],
});
