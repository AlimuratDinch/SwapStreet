import { test, expect } from "@playwright/test";

test("sign up flow demo (for GIF)", async ({ page }) => {
  // 1) Go to landing page
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // 2) Click Get Started -> /auth/sign-up
  // Prefer navbar if present; fallback to exact link name
  const nav = page.getByRole("navigation");
  if (await nav.count()) {
    const navGetStarted = nav.getByRole("link", { name: "Get Started", exact: true });
    if (await navGetStarted.count()) {
      await navGetStarted.click();
    } else {
      await page.getByRole("link", { name: "Get Started", exact: true }).first().click();
    }
  } else {
    await page.getByRole("link", { name: "Get Started", exact: true }).first().click();
  }

  // 3) Assert sign-up page
  await expect(page).toHaveURL(/\/auth\/sign-up/);
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();

  // 4) Fill form (use ids from your FormField props)
  const unique = Date.now();
  const email = `ryad+pw${unique}@example.com`;

  await page.locator("#name").fill(`ryad_pw_${unique}`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Password123!");
  await page.locator("#confirmPassword").fill("Password123!");

  // 5) Submit
  await page.getByRole("button", { name: /^sign up$/i }).click();

  // 6) Expect modal
  await expect(page.getByRole("heading", { name: "Check Your Email" })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  // 7) Pause for video/GIF
  await page.waitForTimeout(2500);
});
