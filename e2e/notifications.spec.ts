import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('Notifications page', () => {
  test('navigates to /notifications and shows page title', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('notifications page shows subtitle', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    await expect(page.locator('text=Vos alertes et mises à jour d\'activité')).toBeVisible();
  });

  test('"mark all read" button is present', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    // The button text comes from notifications.markAllRead translation
    await expect(page.locator('button:has-text("Tout marquer comme lu")')).toBeVisible();
  });

  test('bell icon in topbar links to /notifications', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Click the bell icon link
    await page.click('a[href="/notifications"]');
    await expect(page).toHaveURL('/notifications');
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('notifications page renders notification list area', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    // Page main content should be visible (list or empty state)
    await expect(page.locator('main')).toBeVisible();
  });

  test('filter "unread only" control is present', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    // Filter label from notifications.filterUnread
    await expect(page.locator('text=Non lus uniquement')).toBeVisible();
  });
});
