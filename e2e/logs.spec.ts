import { expect, test } from '@playwright/test';

// Helper to login before each test
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@senagros.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|logs|assets/);
}

test.describe('Logs module', () => {
  test('navigates to /logs and sees the page title', async ({ page }) => {
    await login(page);
    await page.goto('/logs');
    await expect(page.locator('h1')).toContainText("Journal d'activités");
  });

  test('navigates to /logs/seeding and sees seeding page', async ({ page }) => {
    await login(page);
    await page.goto('/logs/seeding');
    await expect(page.locator('h1')).toContainText('Semis');
  });

  test('navigates to /logs/new and sees the creation form', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');
    await expect(page.locator('h1')).toContainText('Nouveau log');
    // Should see the type selector
    await expect(page.locator('select')).toBeVisible();
  });

  test('creates a seeding log with machine type and spacing fields', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');

    // Select seeding type
    await page.selectOption('select', 'seeding');

    // Fill general info
    await page.fill('input[placeholder="Ex: Semis parcelle Nord"]', 'Semis haricot P-06');

    // Select sowing type = machine
    await page.click('input[value="machine"]');

    // Wait for seeding-specific fields to appear
    await expect(page.getByLabel('Profondeur de semis (cm)')).toBeVisible();
    await expect(page.getByLabel('Écartement entre lignes (cm)')).toBeVisible();
    await expect(page.getByLabel('Écartement entre plants (cm)')).toBeVisible();
    await expect(page.getByLabel('Densité de semis')).toBeVisible();

    // Fill seeding fields
    await page.getByLabel('Profondeur de semis (cm)').fill('3');
    await page.getByLabel('Écartement entre lignes (cm)').fill('75');
    await page.getByLabel('Écartement entre plants (cm)').fill('25');
    await page.getByLabel('Densité de semis').fill('120');

    // Select density unit
    await page.locator('select').nth(-1).selectOption('kg_ha');

    // Verify machine selection field appears when machine type is selected
    await expect(page.getByLabel('Machine (semoir/planteuse)')).toBeVisible();
  });

  test('shows equipment and worker assignment section', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');

    // Equipment and worker assignment should always be visible
    await expect(page.getByText('Assignation matériel & personnel')).toBeVisible();
    await expect(page.getByText('Équipements utilisés')).toBeVisible();
    await expect(page.getByText('Employés assignés')).toBeVisible();
  });

  test('shows quantities section with add button', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');

    // Quantities section should be visible
    await expect(page.getByText('Mesures / Quantités')).toBeVisible();
    await expect(page.getByText('Aucune mesure ajoutée')).toBeVisible();

    // Click add button
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // Should show quantity fields
    await expect(page.getByText('Aucune mesure ajoutée')).not.toBeVisible();
  });

  test('seeding form hides machine selection when manual is chosen', async ({ page }) => {
    await login(page);
    await page.goto('/logs/new');

    // Select seeding type
    await page.selectOption('select', 'seeding');

    // Select manual type first
    await page.click('input[value="manual"]');

    // Machine selection should NOT appear
    await expect(page.getByLabel('Machine (semoir/planteuse)')).not.toBeVisible();

    // Switch to machine
    await page.click('input[value="machine"]');

    // Now machine selection should appear
    await expect(page.getByLabel('Machine (semoir/planteuse)')).toBeVisible();
  });
});
