import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').waitFor({ state: 'visible' });
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|parametres|logs|assets/, { timeout: 30000, waitUntil: 'domcontentloaded' });
}

test.describe('Parametres module', () => {
  test('navigates to /parametres and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/parametres');
    await expect(page.locator('h1')).toContainText('Paramètres');
    await expect(page.locator('text=Configuration de l\'exploitation')).toBeVisible();
  });

  test('sees all settings cards', async ({ page }) => {
    await login(page);
    await page.goto('/parametres');
    await expect(page.getByText('Coopérative', { exact: true })).toBeVisible();
    await expect(page.getByText('Membres', { exact: true })).toBeVisible();
    await expect(page.getByText('Langue & Région', { exact: true })).toBeVisible();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
  });

  test('settings cards have descriptions', async ({ page }) => {
    await login(page);
    await page.goto('/parametres');
    await expect(page.locator('text=Gérer les coopératives')).toBeVisible();
    await expect(page.locator('text=Gérer les rôles et permissions')).toBeVisible();
    await expect(page.locator('text=Langue d\'affichage')).toBeVisible();
    await expect(page.locator('text=Alertes de stock')).toBeVisible();
  });

  test('cooperative card navigates to /parametres/cooperative', async ({ page }) => {
    await login(page);
    await page.goto('/parametres');
    await page.click('a:has-text("Coopérative")');
    await page.waitForURL(/parametres\/cooperative/);
    await expect(page.locator('h1')).toContainText('Coopératives');
  });

  test('members card navigates to /employes', async ({ page }) => {
    await login(page);
    await page.goto('/parametres');
    await page.click('a:has-text("Membres")');
    await page.waitForURL(/employes/);
    await expect(page.locator('h1')).toContainText('Employés');
  });

  test('cooperative page loads with content', async ({ page }) => {
    await login(page);
    await page.goto('/parametres/cooperative');
    await expect(page.locator('h1')).toContainText('Coopératives');
    await expect(page.locator('text=Gérez vos coopératives')).toBeVisible();
  });
});
