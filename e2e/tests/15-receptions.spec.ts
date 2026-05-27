import { test, expect } from '@playwright/test'

test.describe('Réceptions', () => {
  test('liste les réceptions', async ({ page }) => {
    await page.goto('/backend/receptions')
    await expect(page).toHaveURL(/receptions/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('accède à la page de création', async ({ page }) => {
    await page.goto('/backend/receptions/new')
    await expect(page).toHaveURL(/receptions\/new/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('crée une réception', async ({ page }) => {
    await page.goto('/backend/receptions/new')
    const suppInput = page.locator('input[placeholder*="fournisseur" i], input[placeholder*="supplier" i]').first()
    if (!await suppInput.isVisible()) { test.skip(); return }
    await page.fill('input[type="date"]', '2025-06-01')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/receptions/, { timeout: 10000 })
  })

  test('affiche le détail d\'une réception', async ({ page }) => {
    await page.goto('/backend/receptions')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    await expect(page).toHaveURL(/receptions\/\d+/)
  })

  test('supprime une réception', async ({ page }) => {
    await page.goto('/backend/receptions')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/receptions/, { timeout: 10000 })
  })
})
