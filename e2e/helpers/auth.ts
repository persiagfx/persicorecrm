import { Page, expect } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/ایمیل|email/i).fill(email);
  await page.getByLabel(/رمز عبور|password/i).fill(password);
  await page.getByRole("button", { name: /ورود|login/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /خروج|logout/i }).click();
  await expect(page).toHaveURL(/login/, { timeout: 5_000 });
}
