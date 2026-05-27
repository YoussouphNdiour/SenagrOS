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
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 })
    const suppInput = page.locator('input[placeholder*="fournisseur" i], input[placeholder*="supplier" i]').first()
    await expect(suppInput).toBeVisible({ timeout: 5000 })
    await page.fill('input[type="date"]', '2025-06-01')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/receptions/, { timeout: 10000 })
  })

  test('affiche le détail d\'une réception', async ({ page }) => {
    await page.goto('/backend/receptions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/receptions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    await expect(page).toHaveURL(/receptions\/\d+/)
  })

  test('supprime une réception', async ({ page }) => {
    await page.goto('/backend/receptions')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/receptions/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/receptions/, { timeout: 10000 })
  })
})
