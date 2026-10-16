import { expect, test } from '@playwright/test';

test('homepage shows the public storefront to anonymous visitors', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produits frais du champ à votre table' })).toBeVisible();
});

test('dashboard redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});

test('a logged-in producer can still open the storefront home', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('admin@senagros.local');
  await page.locator('#password').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL(/\/dashboard/);
  // Let the post-login client navigation settle before leaving the dashboard
  await expect(page.getByTitle('Déconnexion')).toBeVisible();
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Produits frais du champ à votre table' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Tableau de bord/ })).toBeVisible();
});

test('a stale service worker is removed in development', async ({ page }) => {
  test.skip(!!process.env.CI, 'dev-server behaviour only');
  // public/sw.js is a gitignored build artifact: nothing to clean up without it
  const sw = await page.request.get('/sw.js');
  test.skip(!sw.ok(), 'no public/sw.js in this checkout');
  await page.goto('/offline');
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
    .toBe(0);
});
