import { test, expect } from "@playwright/test";

test.describe("Leads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leads");
    await page.waitForLoadState("networkidle");
  });

  test("shows leads list or kanban", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /سرنخ|lead/i })).toBeVisible();
  });

  test("can filter leads by status", async ({ page }) => {
    const statusFilter = page.getByRole("combobox", { name: /وضعیت|status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/leads/);
    }
  });

  test("create a new lead", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /سرنخ جدید|new lead|افزودن/i });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 3_000 });

    const contactName = `E2E Lead ${Date.now()}`;
    await modal.getByLabel(/نام|contact name/i).first().fill(contactName);

    await modal.getByRole("button", { name: /ذخیره|save|ایجاد|create/i }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });

    await expect(page.getByText(contactName)).toBeVisible({ timeout: 5_000 });
  });
});
