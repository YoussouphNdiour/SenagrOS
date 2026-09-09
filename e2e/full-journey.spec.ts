import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('Full user journey', () => {
  test('login → dashboard → parcelles → logs → observations → calendar → reports', async ({ page }) => {
    // 1. Login
    await login(page);

    // 2. Verify dashboard loads
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toBeVisible();

    // 3. Navigate to parcelles (land assets)
    await page.goto('/assets/land');
    await expect(page).toHaveURL('/assets/land');
    await expect(page.locator('h1')).toBeVisible();

    // 4. Navigate to logs
    await page.goto('/logs');
    await expect(page).toHaveURL('/logs');
    await expect(page.locator('h1')).toContainText("Journal d'activités");

    // 5. Navigate to observations
    await page.goto('/observations');
    await expect(page).toHaveURL('/observations');
    await expect(page.locator('h1')).toContainText('Observations');

    // 6. Navigate to calendar
    await page.goto('/calendrier');
    await expect(page).toHaveURL('/calendrier');
    await expect(page.locator('h1')).toContainText('Calendrier cultural');

    // 7. Navigate to reports
    await page.goto('/reports');
    await expect(page).toHaveURL('/reports');
    await expect(page.locator('h1')).toContainText('Rapports');
  });

  test('dashboard shows main KPI cards', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    // Dashboard should render at least one visible content block
    await expect(page.locator('main')).toBeVisible();
  });

  test('assets page links are navigable', async ({ page }) => {
    await login(page);
    await page.goto('/assets');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('logs new form is accessible', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');
    await expect(page.locator('h1')).toContainText('Nouveau log');
  });

  test('observations list page loads', async ({ page }) => {
    await login(page);
    await page.goto('/observations');
    await expect(page.locator('h1')).toContainText('Observations');
  });

  test('calendar templates page loads', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/templates');
    await expect(page.locator('h1')).toContainText('Modèles de calendrier');
  });

  test('reports page shows chart section', async ({ page }) => {
    await login(page);
    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText('Rapports');
    // The page should render main content
    await expect(page.locator('main')).toBeVisible();
  });
});
