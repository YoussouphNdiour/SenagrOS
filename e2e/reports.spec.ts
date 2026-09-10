import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').waitFor({ state: 'visible' });
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|reports|logs|assets/, { timeout: 30000, waitUntil: 'domcontentloaded' });
}

test.describe('Reports module', () => {
  test('navigates to /reports and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Rapports');
    await expect(page.locator('text=Vue d\'ensemble analytique')).toBeVisible();
  });

  test('sees KPI cards on reports page', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    // KPI card titles are inside <p class="text-sm text-gray-500">
    const kpiTitles = page.locator('p.text-sm.text-gray-500');
    await expect(kpiTitles.filter({ hasText: 'Patrimoine' })).toBeVisible();
    await expect(kpiTitles.filter({ hasText: 'Revenus' })).toBeVisible();
    await expect(kpiTitles.filter({ hasText: 'Dépenses' })).toBeVisible();
    await expect(kpiTitles.filter({ hasText: 'Bénéfice net' })).toBeVisible();
  });

  test('shows date filter inputs', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });

  test('shows export buttons', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
  });

  test('shows charts section', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await expect(page.locator('text=Revenus & Dépenses')).toBeVisible();
    await expect(page.locator('text=Répartition du patrimoine')).toBeVisible();
  });

  test('shows quick links to sub-reports', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await expect(page.locator('text=Rapport Patrimoine')).toBeVisible();
    await expect(page.locator('text=Rapport Activités')).toBeVisible();
    await expect(page.locator('text=Rapport Récoltes')).toBeVisible();
  });

  test('navigates to /reports/assets sub-report', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.click('text=Rapport Patrimoine');
    await page.waitForURL(/reports\/assets/);
  });

  test('navigates to /reports/logs sub-report', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.click('text=Rapport Activités');
    await page.waitForURL(/reports\/logs/);
  });

  test('navigates to /reports/harvests sub-report', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await page.click('text=Rapport Récoltes');
    await page.waitForURL(/reports\/harvests/);
  });

  test('date filter updates data', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    const dateFrom = page.locator('input[type="date"]').first();
    const dateTo = page.locator('input[type="date"]').last();
    await dateFrom.fill('2026-01-01');
    await dateTo.fill('2026-12-31');
    // KPIs should still be visible after filtering
    await expect(page.locator('p.text-sm.text-gray-500').filter({ hasText: 'Patrimoine' })).toBeVisible();
  });
});
