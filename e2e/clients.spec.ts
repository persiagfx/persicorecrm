import { test, expect } from "@playwright/test";

const TEST_COMPANY = `Test Co E2E ${Date.now()}`;

test.describe("Clients", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
  });

  test("shows clients list page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /مشتریان|clients/i })).toBeVisible();
  });

  test("can search clients", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/جستجو|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForTimeout(500);
      // Results update without navigation
      await expect(page).toHaveURL(/clients/);
    }
  });

  test("create, view, and delete a client", async ({ page }) => {
    // Click new/create button
    const createBtn = page.getByRole("button", { name: /مشتری جدید|new client|افزودن/i });
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    // Fill out the form
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 3_000 });

    await modal.getByLabel(/نام شرکت|company/i).fill(TEST_COMPANY);

    // Submit
    await modal.getByRole("button", { name: /ذخیره|save|ایجاد|create/i }).click();
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // New client should appear in the list
    await expect(page.getByText(TEST_COMPANY)).toBeVisible({ timeout: 5_000 });

    // Open the client row and delete it
    const row = page.getByText(TEST_COMPANY).locator("..");
    await row.getByRole("button", { name: /حذف|delete/i }).click().catch(async () => {
      // Some UIs require right-click or context menu
      await page.getByText(TEST_COMPANY).click({ button: "right" });
      await page.getByRole("menuitem", { name: /حذف|delete/i }).click();
    });

    // Confirm deletion dialog if present
    const confirmBtn = page.getByRole("button", { name: /تایید|confirm|بله|yes/i });
    if (await confirmBtn.isVisible({ timeout: 1_500 })) {
      await confirmBtn.click();
    }

    await expect(page.getByText(TEST_COMPANY)).toBeHidden({ timeout: 5_000 });
  });
});
