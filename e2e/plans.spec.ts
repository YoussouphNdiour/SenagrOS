import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('Plans module', () => {
  test('navigates to /plans and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/plans');
    await expect(page.locator('h1')).toContainText('Plans & Campagnes');
  });

  test('sees KPI cards on plans page', async ({ page }) => {
    await login(page);
    await page.goto('/plans');
    await expect(page.locator('text=Total plans')).toBeVisible();
    await expect(page.locator('text=Actifs')).toBeVisible();
    await expect(page.locator('text=Terminés')).toBeVisible();
  });

  test('navigates to /plans/new and sees creation form', async ({ page }) => {
    await login(page);
    await page.goto('/plans/new');
    await expect(page.locator('h1')).toContainText('Nouveau plan');
    await expect(page.locator('input[required]')).toBeVisible();
  });

  test('creates Campagne Hivernage 2026 plan', async ({ page }) => {
    await login(page);
    await page.goto('/plans/new');

    // Fill the form
    await page.fill('input[required]', 'Campagne Hivernage 2026');
    await page.selectOption('select:first-of-type', { value: 'crop' });

    // Select season
    const seasonSelects = page.locator('select');
    if (await seasonSelects.nth(1).isVisible()) {
      await seasonSelects.nth(1).selectOption({ value: 'hivernage' });
    }

    // Set dates
    await page.fill('input[type="date"]:first-of-type', '2026-06-01');
    await page.fill('input[type="date"]:last-of-type', '2026-10-31');

    // Submit
    await page.click('button:has-text("Créer le plan")');

    // Should redirect to plan detail
    await page.waitForURL(/plans\/[a-f0-9-]+/);

    // Verify plan name shows
    await expect(page.locator('h1')).toContainText('Campagne Hivernage 2026');
  });

  test('plan detail shows progression bar and log section', async ({ page }) => {
    await login(page);

    // Create a plan first
    await page.goto('/plans/new');
    await page.fill('input[required]', 'Plan Test Progression');
    await page.selectOption('select:first-of-type', { value: 'harvest' });
    await page.click('button:has-text("Créer le plan")');
    await page.waitForURL(/plans\/[a-f0-9-]+/);

    // Should see progression section
    await expect(page.locator('text=Progression')).toBeVisible();
    await expect(page.locator('text=Logs associés')).toBeVisible();
    await expect(page.locator('text=Ajouter un log')).toBeVisible();
  });

  test('can navigate to edit page from detail', async ({ page }) => {
    await login(page);

    // Create a plan
    await page.goto('/plans/new');
    await page.fill('input[required]', 'Plan Editable');
    await page.selectOption('select:first-of-type', { value: 'grazing' });
    await page.click('button:has-text("Créer le plan")');
    await page.waitForURL(/plans\/[a-f0-9-]+/);

    // Click edit
    await page.click('a:has-text("Éditer")');
    await page.waitForURL(/plans\/[a-f0-9-]+\/edit/);
    await expect(page.locator('h1')).toContainText('Modifier le plan');
  });
});
