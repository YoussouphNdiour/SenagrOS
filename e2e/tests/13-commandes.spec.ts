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
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 })
    const selects = page.locator('select')
    const count = await selects.count()
    if (count > 0) {
      const firstOpts = await selects.first().locator('option').count()
      expect(firstOpts, 'Des options doivent exister dans le formulaire de commande').toBeGreaterThan(1)
      await selects.first().selectOption({ index: 1 })
    }
    await page.fill('input[type="date"]', '2025-06-01')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/purchase_orders/, { timeout: 10000 })
  })

  test('affiche le détail d\'une commande', async ({ page }) => {
    await page.goto('/backend/purchase_orders')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/purchase_orders/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    await expect(page).toHaveURL(/purchase_orders\/\d+/)
  })

  test('supprime une commande', async ({ page }) => {
    await page.goto('/backend/purchase_orders')
    await page.waitForLoadState('networkidle')
    const firstLink = page.locator('table a, td a, a[href*="/purchase_orders/"]').first()
    await expect(firstLink).toBeVisible({ timeout: 5000 })
    await firstLink.click()
    const deleteBtn = page.getByRole('button', { name: /Supprimer/i })
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await expect(deleteBtn).toBeEnabled()
    page.on('dialog', d => d.accept())
    await deleteBtn.click()
    await expect(page).toHaveURL(/purchase_orders/, { timeout: 10000 })
  })
})
