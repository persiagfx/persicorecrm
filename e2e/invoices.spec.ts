import { test, expect } from "@playwright/test";

test.describe("Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");
  });

  test("shows invoices list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /فاکتور|invoice/i })).toBeVisible();
  });

  test("can filter by status", async ({ page }) => {
    // Status tabs or dropdown
    const paidTab = page.getByRole("tab", { name: /پرداخت‌شده|paid/i });
    if (await paidTab.isVisible()) {
      await paidTab.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("invoice detail page loads", async ({ page }) => {
    const firstRow = page.getByRole("row").nth(1);
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/invoices\//);
    }
  });
});
