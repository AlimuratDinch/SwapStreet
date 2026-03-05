import { test, expect } from "@playwright/test";

test("sign up flow demo (for GIF)", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // navigate to sign-up page
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

  // check if sign up page loaded
  await expect(page).toHaveURL(/\/auth\/sign-up/);
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();

  // fill form 
  const unique = Date.now();
  const email = `ryad+pw${unique}@example.com`;

  await page.locator("#name").fill(`ryad_pw_${unique}`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("Password123!");
  await page.locator("#confirmPassword").fill("Password123!");

  // submit
  await page.getByRole("button", { name: /^sign up$/i }).click();

  // expect to check email
  await expect(page.getByRole("heading", { name: "Check Your Email" })).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();

  await page.waitForTimeout(2500);
});
