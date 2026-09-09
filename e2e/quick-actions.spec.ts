import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('Quick actions', () => {
  test('navigates to /quick and shows page title', async ({ page }) => {
    await login(page);
    await page.goto('/quick');
    await expect(page.locator('h1')).toContainText('Action rapide');
  });

  test('all 5 action links are visible', async ({ page }) => {
    await login(page);
    await page.goto('/quick');

    await expect(page.locator('a[href="/quick/harvest"]')).toBeVisible();
    await expect(page.locator('a[href="/quick/observation"]')).toBeVisible();
    await expect(page.locator('a[href="/quick/input"]')).toBeVisible();
    await expect(page.locator('a[href="/quick/irrigation"]')).toBeVisible();
    await expect(page.locator('a[href="/quick/birth"]')).toBeVisible();
  });

  test('action labels are displayed', async ({ page }) => {
    await login(page);
    await page.goto('/quick');

    await expect(page.locator('text=Récolte')).toBeVisible();
    await expect(page.locator('text=Observation')).toBeVisible();
    await expect(page.locator('text=Intrant')).toBeVisible();
    await expect(page.locator('text=Irrigation')).toBeVisible();
    await expect(page.locator('text=Naissance')).toBeVisible();
  });

  test('clicking harvest link loads harvest form', async ({ page }) => {
    await login(page);
    await page.goto('/quick');

    await page.click('a[href="/quick/harvest"]');
    await expect(page).toHaveURL('/quick/harvest');
    await expect(page.locator('h1')).toContainText('Récolte rapide');
  });

  test('harvest form has a "back to quick actions" link', async ({ page }) => {
    await login(page);
    await page.goto('/quick/harvest');
    await expect(page.locator('a[href="/quick"]')).toBeVisible();
  });

  test('going back from harvest and clicking irrigation loads irrigation form', async ({ page }) => {
    await login(page);
    await page.goto('/quick');

    // Click harvest first
    await page.click('a[href="/quick/harvest"]');
    await expect(page).toHaveURL('/quick/harvest');

    // Go back to quick page
    await page.goto('/quick');
    await expect(page).toHaveURL('/quick');

    // Click irrigation
    await page.click('a[href="/quick/irrigation"]');
    await expect(page).toHaveURL('/quick/irrigation');
    await expect(page.locator('h1')).toContainText('Irrigation rapide');
  });

  test('observation quick form loads', async ({ page }) => {
    await login(page);
    await page.goto('/quick/observation');
    await expect(page.locator('h1')).toContainText('Observation rapide');
  });

  test('input quick form loads', async ({ page }) => {
    await login(page);
    await page.goto('/quick/input');
    await expect(page.locator('h1')).toContainText('Intrant rapide');
  });

  test('birth quick form loads', async ({ page }) => {
    await login(page);
    await page.goto('/quick/birth');
    await expect(page.locator('h1')).toContainText('Naissance rapide');
  });
});
