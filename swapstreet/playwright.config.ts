import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost",

    // ✅ GIF workflow: record video
    video: "on", // or "retain-on-failure"

    // Optional but nice for GIFs
    viewport: { width: 1280, height: 720 },

    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },

  // ✅ Since Docker/Nginx is already running on localhost:80,
  // you do NOT want Playwright to run `npm run dev`.
  // Either remove webServer entirely OR keep it only if you run dev locally.
  webServer: process.env.PW_USE_DEV_SERVER
    ? {
        command: "npm ci && npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,

  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
    { name: "ipad", use: { ...devices["iPad (gen 7)"] } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "pixel-5", use: { ...devices["Pixel 5"] } },
  ],
});
