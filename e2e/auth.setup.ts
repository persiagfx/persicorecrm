import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/ایمیل|email/i).fill(process.env.E2E_ADMIN_EMAIL ?? "admin@test.com");
  await page.getByLabel(/رمز عبور|password/i).fill(process.env.E2E_ADMIN_PASSWORD ?? "adminpassword123");
  await page.getByRole("button", { name: /ورود|login/i }).click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

  await page.context().storageState({ path: authFile });
});
