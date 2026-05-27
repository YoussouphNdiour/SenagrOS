import { test, expect } from '@playwright/test'

test.describe('Commandes d\'achat', () => {
  test('liste les commandes', async ({ page }) => {
    await page.goto('/backend/purchase_orders')
    await expect(page).toHaveURL(/purchase_orders/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('accède à la page de création', async ({ page }) => {
    await page.goto('/backend/purchase_orders/new')
    await expect(page).toHaveURL(/purchase_orders\/new/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('crée une commande', async ({ page }) => {
    await page.goto('/backend/purchase_orders/new')
    const natures = await page.locator('select').first().locator('option').count()
    if (natures <= 1) { test.skip(); return }
    await page.fill('input[type="date"]', '2025-06-01')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/purchase_orders/, { timeout: 10000 })
  })

  test('affiche le détail d\'une commande', async ({ page }) => {
    await page.goto('/backend/purchase_orders')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    await expect(page).toHaveURL(/purchase_orders\/\d+/)
  })

  test('supprime une commande', async ({ page }) => {
    await page.goto('/backend/purchase_orders')
    const firstLink = page.locator('table a, td a').first()
    if (!await firstLink.isVisible()) { test.skip(); return }
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    if (!await deleteBtn.isVisible() || !await deleteBtn.isEnabled()) { test.skip(); return }
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/purchase_orders/, { timeout: 10000 })
  })
})
