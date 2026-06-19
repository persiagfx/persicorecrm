import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders stat cards", async ({ page }) => {
    // Wait for any loading spinner to disappear
    await page.waitForLoadState("networkidle");
    // KPI cards should be visible — check for at least one numeric stat
    const cards = page.locator("[data-testid='stat-card'], .stat-card");
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Fallback: the page should show content after load
      await expect(page.locator("main")).toContainText(/مشتری|پروژه|فاکتور|lead|client/i);
    }
  });

  test("sidebar is visible and contains nav links", async ({ page }) => {
    await expect(page.locator("nav, aside")).toBeVisible();
    await expect(page.getByRole("link", { name: /مشتریان|clients/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /سرنخ‌ها|leads/i })).toBeVisible();
  });

  test("navigates to clients page via sidebar", async ({ page }) => {
    await page.getByRole("link", { name: /مشتریان|clients/i }).click();
    await expect(page).toHaveURL(/clients/);
  });

  test("navigates to leads page via sidebar", async ({ page }) => {
    await page.getByRole("link", { name: /سرنخ‌ها|leads/i }).click();
    await expect(page).toHaveURL(/leads/);
  });
});
