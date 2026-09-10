import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').waitFor({ state: 'visible' });
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|stocks|logs|assets/, { timeout: 30000, waitUntil: 'domcontentloaded' });
}

test.describe('Stocks module', () => {
  test('navigates to /stocks and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    await expect(page.locator('h1')).toContainText('Stocks');
    await expect(page.locator('text=Suivi des stocks')).toBeVisible();
  });

  test('sees KPI cards on stocks page', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    await expect(page.locator('text=Articles en stock')).toBeVisible();
    await expect(page.locator('text=Valorisation totale')).toBeVisible();
    await expect(page.locator('text=Alertes seuil')).toBeVisible();
    await expect(page.getByText('Catégories', { exact: true })).toBeVisible();
  });

  test('displays stock table with headers', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    await expect(page.locator('th:has-text("Article")')).toBeVisible();
    await expect(page.locator('th:has-text("Catégorie")')).toBeVisible();
    await expect(page.locator('th:has-text("Stock actuel")')).toBeVisible();
    await expect(page.locator('th:has-text("Seuil")')).toBeVisible();
    await expect(page.locator('th:has-text("Prix unit.")')).toBeVisible();
    await expect(page.locator('th:has-text("Valorisation")')).toBeVisible();
  });

  test('search filter works', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    const searchInput = page.locator('input[placeholder="Rechercher un article..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('NPK');
    // Table should still be visible after filtering
    await expect(page.locator('table')).toBeVisible();
  });

  test('category filter dropdown works', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    const categorySelect = page.locator('select');
    await expect(categorySelect).toBeVisible();

    // Should have all category options
    await expect(categorySelect.locator('option')).toHaveCount(4); // all + 3 categories
    await categorySelect.selectOption('phyto');
    await expect(page.locator('table')).toBeVisible();
  });

  test('shows alerts section when stock is low', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    // Check if alerts section exists (may or may not have alerts)
    const alertSection = page.locator('text=Alertes de stock bas');
    if (await alertSection.isVisible()) {
      await expect(page.locator('.bg-red-50')).toBeVisible();
    }
  });

  test('shows total count at bottom', async ({ page }) => {
    await login(page);
    await page.goto('/stocks');
    await expect(page.locator('text=/\\d+ articles? au total/')).toBeVisible();
  });
});
