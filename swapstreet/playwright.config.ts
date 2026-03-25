import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  testMatch: ["e2e/**/*.spec.ts", "gifs/playwrightTests/**/*.spec.ts"],
  testIgnore: process.env.CI ? "**/gifs/playwrightTests/**" : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.CI ? "http://localhost:3000" : "http://localhost",
    video: "on",
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },

  webServer: process.env.CI
    ? {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : process.env.PW_USE_DEV_SERVER
      ? {
          command: "npm run dev",
          url: "http://localhost",
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