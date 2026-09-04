import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|plans|logs|assets/);
}

test.describe('Offline / PWA', () => {
  test('offline banner appears when network goes offline and disappears when back online', async ({
    page,
    context,
  }) => {
    await login(page);
    await page.goto('/dashboard');

    // Banner should not be visible while online
    await expect(page.locator('[role="alert"]')).not.toBeVisible();

    // Simulate going offline
    await context.setOffline(true);

    // Banner should appear with "Hors ligne" text
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText('Hors ligne');

    // Come back online
    await context.setOffline(false);

    // Banner should disappear
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test('/offline page shows correct content', async ({ page }) => {
    await page.goto('/offline');

    // Should show WifiOff icon container
    await expect(page.locator('svg')).toBeVisible();

    // Should show heading
    await expect(
      page.locator('h1', { hasText: 'Vous êtes hors ligne' }),
    ).toBeVisible();

    // Should show Réessayer button
    await expect(
      page.locator('button', { hasText: 'Réessayer' }),
    ).toBeVisible();
  });

  test('/manifest.webmanifest returns correct JSON', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/);

    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      theme_color: string;
      display: string;
      icons: unknown[];
    };

    expect(manifest.name).toBe('SenagrOS — Système de Gestion Agricole');
    expect(manifest.short_name).toBe('SenagrOS');
    expect(manifest.theme_color).toBe('#16a34a');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
