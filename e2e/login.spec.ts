import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ورود|login/i })).toBeVisible();
    await expect(page.getByLabel(/ایمیل|email/i)).toBeVisible();
    await expect(page.getByLabel(/رمز عبور|password/i)).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.getByLabel(/ایمیل|email/i).fill("wrong@test.com");
    await page.getByLabel(/رمز عبور|password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /ورود|login/i }).click();

    await expect(page.getByText(/اشتباه|خطا|error|invalid/i)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.getByLabel(/ایمیل|email/i).fill(process.env.E2E_ADMIN_EMAIL ?? "admin@test.com");
    await page.getByLabel(/رمز عبور|password/i).fill(process.env.E2E_ADMIN_PASSWORD ?? "adminpassword123");
    await page.getByRole("button", { name: /ورود|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("empty form shows validation error", async ({ page }) => {
    await page.getByRole("button", { name: /ورود|login/i }).click();
    // Either a browser validation error or custom validation toast
    const hasError =
      (await page.locator("input:invalid").count()) > 0 ||
      (await page.getByText(/الزامی|required/i).count()) > 0;
    expect(hasError).toBe(true);
  });
});
