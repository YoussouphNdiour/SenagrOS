import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('i18n — locale switching', () => {
  test('switches to English and shows English text', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Click the EN button in LocaleSwitcher
    await page.click('button:has-text("EN")');
    await page.waitForLoadState('networkidle');

    // Dashboard title should be in English
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('switches to Wolof and shows Wolof text', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Click the WO button in LocaleSwitcher
    await page.click('button:has-text("WO")');
    await page.waitForLoadState('networkidle');

    // Dashboard title in Wolof is "Kër gi"
    await expect(page.locator('h1')).toContainText('Kër gi');
  });

  test('switches back to French and shows French text', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Switch away from FR first
    await page.click('button:has-text("EN")');
    await page.waitForLoadState('networkidle');

    // Switch back to FR
    await page.click('button:has-text("FR")');
    await page.waitForLoadState('networkidle');

    // Dashboard title should be in French
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('locale switcher renders all three locale buttons', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    await expect(page.locator('button:has-text("FR")')).toBeVisible();
    await expect(page.locator('button:has-text("EN")')).toBeVisible();
    await expect(page.locator('button:has-text("WO")')).toBeVisible();
  });

  test('locale is persisted across navigation after switching to EN', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Switch to English
    await page.click('button:has-text("EN")');
    await page.waitForLoadState('networkidle');

    // Navigate to a different page
    await page.goto('/logs');

    // Logs page title should be in English ("Activities" not "Journal d'activités")
    await expect(page.locator('h1')).toContainText('Activities');

    // Restore to FR
    await page.click('button:has-text("FR")');
    await page.waitForLoadState('networkidle');
  });

  test('search placeholder changes with locale', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await page.goto('/dashboard');

    // Default FR: placeholder is "Rechercher"
    const searchInput = page.locator('input[placeholder="Rechercher"]');
    await expect(searchInput).toBeVisible();

    // Switch to EN
    await page.click('button:has-text("EN")');
    await page.waitForLoadState('networkidle');

    // EN: placeholder is "Search"
    const searchInputEn = page.locator('input[placeholder="Search"]');
    await expect(searchInputEn).toBeVisible();

    // Restore to FR
    await page.click('button:has-text("FR")');
    await page.waitForLoadState('networkidle');
  });
});
