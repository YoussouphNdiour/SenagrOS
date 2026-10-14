import { expect, test } from '@playwright/test';

test('homepage shows the public storefront to anonymous visitors', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produits frais du champ à votre table' })).toBeVisible();
});

test('dashboard redirects anonymous visitors to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});
