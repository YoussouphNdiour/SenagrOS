import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|calendrier|logs|assets/);
}

test.describe('Calendar module', () => {
  test('navigates to /calendrier and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier');
    await expect(page.locator('h1')).toContainText('Calendrier cultural');
  });

  test('navigates to /calendrier/templates and sees template list', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/templates');
    await expect(page.locator('h1')).toContainText('Modèles de calendrier');
  });

  test('navigates to /calendrier/templates/new and sees creation form', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/templates/new');
    await expect(page.locator('h1')).toContainText('Créer un modèle de calendrier');
    // Should see the crop type selector
    await expect(page.locator('select')).toBeVisible();
  });

  test('creates a haricot vert template with 7 stages', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/templates/new');

    // Select crop type — this should pre-fill stages
    await page.selectOption('select', { label: 'Haricot vert' });

    // Verify stages pre-filled
    await expect(page.locator('table tbody tr')).toHaveCount(7);

    // Set name
    await page.fill('input[placeholder="Ex: Haricot vert Euforia — cycle 84j"]', 'Haricot vert Euforia — cycle 84j');

    // Set variety
    await page.fill('input[placeholder="Ex: Euforia"]', 'Euforia');

    // Verify total days
    await expect(page.locator('text=84 jours')).toBeVisible();

    // Submit
    await page.click('button:has-text("Enregistrer")');

    // Should redirect to templates list
    await page.waitForURL(/calendrier\/templates/);
  });

  test('navigates to /calendrier/assign and sees assign form', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/assign');
    await expect(page.locator('h1')).toContainText('Assigner un calendrier');
    // Should see parcel and template selectors
    const selects = page.locator('select');
    await expect(selects).toHaveCount(2);
  });

  test('assign form shows preview dates when template and sowing date are selected', async ({ page }) => {
    await login(page);
    await page.goto('/calendrier/assign');

    // Select first available template if any
    const templateSelect = page.locator('select').nth(1);
    const options = await templateSelect.locator('option').all();

    // If we have at least one template (from previous test), select it
    if (options.length > 1) {
      await templateSelect.selectOption({ index: 1 });

      // Fill sowing date
      await page.fill('input[type="date"]', '2026-03-14');

      // Should show preview table
      await expect(page.locator('text=Dates prévisionnelles')).toBeVisible();
    }
  });
});
